import { NextRequest, NextResponse } from 'next/server';

import { createFormSubmission } from '@codeware/app-cms/data-access';
import type { FormSubmission } from '@codeware/shared/util/payload-types';

import { authenticatedPayload } from '../../../security/authenticated-payload';

/**
 * Server-side API route for handling form submissions.
 *
 * This route:
 * - Receives form data from the client
 * - Authenticates with Payload using server-side credentials (e.g. API key)
 * - Submits the form to Payload's form-submissions collection
 * - Returns only a minimal success/error response to the client
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: FormSubmission = await request.json();

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
    const { id } = await createFormSubmission(payload, body);

    // Return minimal success response (don't expose full form submission data)
    return NextResponse.json({
      success: true,
      id
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
