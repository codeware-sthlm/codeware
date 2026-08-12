import { APIError } from 'payload';

/**
 * A signup the platform refuses on purpose.
 *
 * Capacity refusals and a closed tour are ordinary answers, not faults: the
 * caller gets a message written for them, and nothing is wrong with the
 * server. They arrive often enough in normal use that logging a stack trace
 * for each one buries the errors that do need reading.
 *
 * The name is what `loggingLevels` keys off in `payload.config.ts`, where it
 * is set to `info` — message only, no stack. Every other `APIError` keeps its
 * stack, which is the point of not simply quietening `APIError` wholesale.
 */
export class SignupRefusedError extends APIError {
  constructor(message: string, status = 400) {
    super(message, status);
    this.name = 'SignupRefused';
  }
}
