import { post } from '@codeware/shared/util/payload-api';
import { json } from '@remix-run/node';

import { getPayloadRequestOptions } from '../utils/get-payload-request-options';
import type { TypedActionFunctionArgs } from '../utils/types';

type Body = {
  tour?: number;
  name?: string;
  email?: string;
  phone?: string;
  people?: number;
};

/**
 * Handle tour signups against the Payload REST API.
 *
 * Runs server-side so the tenant api key never reaches the browser, exactly
 * like the form submission route. The response carries the status the server
 * decided from capacity — booked, or on the waiting list.
 */
export async function action({ context, request }: TypedActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ message: 'Method not allowed' }, { status: 405 });
  }
  if (request.headers.get('Content-Type') !== 'application/json') {
    return json(
      { message: 'Invalid content type, expecting "application/json"' },
      { status: 415 }
    );
  }

  const body = (await request.json()) as Body;

  if (!body?.tour || !body?.name || !body?.email || !body?.people) {
    return json({ message: 'Invalid tour signup body' }, { status: 400 });
  }

  const requestOptions = getPayloadRequestOptions(
    'POST',
    context,
    request.headers,
    body
  );

  try {
    const response = await post('tour-signups', requestOptions);
    const doc = (response as { doc?: { id: number; status: string } })?.doc;

    return json({
      success: true,
      id: doc?.id,
      status: doc?.status
    });
  } catch (e) {
    const error = e as Error;
    return json(
      { success: false, message: error?.message ?? 'Unknown error' },
      { status: 400 }
    );
  }
}

// Add a loader to handle GET requests if needed
export async function loader() {
  return json(
    { message: 'This endpoint only accepts POST requests' },
    { status: 405 }
  );
}
