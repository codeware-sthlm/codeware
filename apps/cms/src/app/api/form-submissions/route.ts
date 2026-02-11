import { NextRequest, NextResponse } from 'next/server';

import type { FormSubmission } from '@codeware/shared/util/payload-types';

import { authenticatedPayload } from '../../../security/authenticated-payload';

type FormSubmitData = {
  form: FormSubmission['form'];
  submissionData: Array<
    Pick<
      NonNullable<FormSubmission['submissionData']>[number],
      'field' | 'value'
    >
  >;
};

/**
 * Server-side API route for handling form submissions.
 *
 * This route:
 * - Receives form data from the client
 * - Authenticates with Payload using server-side credentials (API key)
 * - Submits the form to Payload's form-submissions collection
 * - Returns only a minimal success/error response to the client
 *
 * This keeps sensitive data (API keys, full form responses) hidden from the client.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: FormSubmitData = await request.json();

    // Validate required fields
    if (!body.form || !body.submissionData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get authenticated Payload instance (uses server-side API key)
    const payload = await authenticatedPayload();

    // Submit the form to Payload's form-submissions collection
    const formSubmission = await payload.create({
      collection: 'form-submissions',
      data: {
        form: body.form,
        submissionData: body.submissionData
      }
    });

    // Return minimal success response (don't expose full form submission data)
    return NextResponse.json({
      success: true,
      id: formSubmission.id
    });
  } catch (error) {
    console.error('Form submission error:', error);

    return NextResponse.json(
      {
        error: 'Failed to submit form',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
