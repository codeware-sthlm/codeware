import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { isUser } from '@codeware/app-cms/util/misc';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { type Endpoint, type PayloadRequest, headersWithCors } from 'payload';

import { readQueryStats, resetQueryStats } from '../perf/query-stats';

/**
 * Reports aggregated database query counts collected while `PERF_PROFILE` is on.
 *
 * Typical use: `?reset=true` before an action, then read it back after, to see
 * exactly which queries a single page render fanned out into.
 */
export const perfStatsEndpoint: Endpoint = {
  path: '/perf-stats',
  method: 'get',
  handler: async (req: PayloadRequest): Promise<Response> => {
    const respond = (body: unknown, status: number) =>
      Response.json(body, {
        status,
        headers: headersWithCors({ headers: new Headers(), req })
      });

    // Profiling is a development aid — never expose it when it is not enabled
    if (!getEnv().PERF_PROFILE) {
      return respond(
        { error: getReasonPhrase(StatusCodes.NOT_FOUND) },
        StatusCodes.NOT_FOUND
      );
    }

    // Admin-session users only; API key clients have no business reading this
    if (!isUser(req.user)) {
      return respond(
        { error: getReasonPhrase(StatusCodes.FORBIDDEN) },
        StatusCodes.FORBIDDEN
      );
    }

    if (req.searchParams.get('reset') === 'true') {
      resetQueryStats();
      return respond({ reset: true }, StatusCodes.OK);
    }

    const limit = Number(req.searchParams.get('limit')) || undefined;

    return respond(readQueryStats(limit), StatusCodes.OK);
  }
};
