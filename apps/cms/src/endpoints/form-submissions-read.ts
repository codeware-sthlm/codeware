import {
  getFormSubmissions,
  mapToRuntime
} from '@codeware/app-cms/data-access';
import { isUser } from '@codeware/app-cms/util/misc';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import {
  type Endpoint,
  type PayloadRequest,
  addDataAndFileToRequest,
  headersWithCors
} from 'payload';

import { getTenantWhereFromHeaders } from '../components/admin/utils/tenant-where';

/** Upper bound on a single call, matching the list view's page size cap */
const MAX_IDS = 100;

/** Coerce the posted ids to the numeric document ids this deployment uses */
function parseIds(value: unknown): Array<number> {
  if (!Array.isArray(value)) {
    return [];
  }
  const ids = value
    .map((id) => (typeof id === 'number' ? id : Number(id)))
    .filter((id) => Number.isInteger(id) && id > 0);

  return [...new Set(ids)].slice(0, MAX_IDS);
}

/**
 * Mark form submissions read or unread for the admin's unread marker.
 *
 * Submissions are immutable by design (`update: () => false`), so the write
 * runs with `overrideAccess` — authorization is done here instead: the caller
 * must be an admin user, and only ids that came back from a *read* under their
 * own access and workspace scope are written. A tenant api key identity has no
 * business marking messages read and is rejected outright.
 */
export const formSubmissionsReadEndpoint: Endpoint = {
  path: '/form-submissions-read',
  method: 'post',
  handler: async (req: PayloadRequest): Promise<Response> => {
    if (!isUser(req.user)) {
      return Response.json(
        { error: getReasonPhrase(StatusCodes.FORBIDDEN) },
        { status: StatusCodes.FORBIDDEN }
      );
    }

    await addDataAndFileToRequest(req);
    const body = (req.data ?? {}) as { ids?: unknown; read?: unknown };
    const ids = parseIds(body.ids);
    const read = body.read !== false;

    const respond = (updated: Array<number>) =>
      Response.json(
        { updated },
        {
          status: StatusCodes.OK,
          headers: headersWithCors({ headers: new Headers(), req })
        }
      );

    if (!ids.length) {
      return respond([]);
    }

    try {
      const tenantWhere = getTenantWhereFromHeaders(req.headers, req.user);
      const runtime = mapToRuntime(req.payload, req.user);

      // Reading under the caller's own access is what authorizes the write
      // below — only ids that come back may be touched
      const readable = await getFormSubmissions(runtime, {
        where: {
          and: [{ id: { in: ids } }, ...(tenantWhere ? [tenantWhere] : [])]
        },
        limit: ids.length
      });

      const allowedIds = (readable?.docs ?? []).map((doc) => doc.id);
      if (!allowedIds.length) {
        return respond([]);
      }

      await req.payload.update({
        collection: 'form-submissions',
        where: { id: { in: allowedIds } },
        data: { readAt: read ? new Date().toISOString() : null },
        depth: 0,
        overrideAccess: true,
        req
      });

      return respond(allowedIds);
    } catch (error) {
      req.payload.logger.error(
        `[formSubmissionsRead] Update failed: ${String(error)}`
      );
      return Response.json(
        { error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) },
        { status: StatusCodes.INTERNAL_SERVER_ERROR }
      );
    }
  }
};
