import { post } from '@codeware/shared/util/payload-api';
import type { FormSubmission } from '@codeware/shared/util/payload-types';
import { type ActionFunctionArgs, json } from '@remix-run/node';

import { getPayloadRequestOptions } from '../utils/get-payload-request-options';

/**
 * Handle form submission requests to the Payload REST API.
 */
export async function action({ context, request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ message: 'Method not allowed' }, { status: 405 });
  }
  if (request.headers.get('Content-Type') !== 'application/json') {
    return json(
      { message: 'Invalid content type, expecting "application/json"' },
      { status: 415 }
    );
  }

  // Get the body from the request
  const body = (await request.json()) as FormSubmission;

  if (!body?.form || !(body?.submissionData ?? []).length) {
    return json({ message: 'Invalid form submission body' }, { status: 400 });
  }

  // Create request options with authentication
  const requestOptions = getPayloadRequestOptions(
    'POST',
    context,
    request.headers,
    body
  );

  console.log('Send form submission request', requestOptions);

  try {
    const response = await post('form-submissions', requestOptions);
    return json({ success: true, data: response });
  } catch (e) {
    const error = e as Error;
    return json(
      { success: false, data: { error: error?.message ?? 'Unknown error' } },
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
