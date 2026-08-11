import { createTourSignup } from '@codeware/app-cms/data-access';
import { NextRequest, NextResponse } from 'next/server';

import { payloadRuntime } from '../../../security/payload-runtime';

type Body = {
  tour?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  people?: unknown;
};

const asString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

/**
 * Server-side API route for tour signups.
 *
 * This route:
 * - Receives the customer's details from the site
 * - Authenticates with Payload using server-side credentials (api key)
 * - Creates the signup, whose status the server decides from capacity
 * - Returns only that status, never the signup itself
 *
 * The status is the one thing the customer has to be told: booked, or on the
 * waiting list. Nothing else about the tour's signups is exposed here.
 */
export async function POST(request: NextRequest) {
  try {
    const body: Body = await request.json();

    const tour = Number(body.tour);
    const name = asString(body.name);
    const email = asString(body.email);
    const people = Number(body.people);

    if (
      !Number.isInteger(tour) ||
      tour < 1 ||
      !name ||
      !email ||
      !Number.isInteger(people) ||
      people < 1
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const runtime = await payloadRuntime();

    const signup = await createTourSignup(runtime, {
      tour,
      name,
      email,
      people,
      phone: asString(body.phone) || null
    });

    return NextResponse.json({
      success: true,
      id: signup.id,
      status: signup.status
    });
  } catch (error) {
    console.error('Tour signup error:', error);

    return NextResponse.json(
      {
        error: 'Failed to submit signup',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
