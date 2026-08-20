import { describe, expect, it } from 'vitest';

import {
  SUBMISSION_ID_HEADER,
  attachSubmissionId
} from './attach-submission-id';

type Args = Parameters<typeof attachSubmissionId>;

const email = {
  from: 'no-reply@codeware.se',
  html: '<div>hi</div>',
  replyTo: 'no-reply@codeware.se',
  subject: 'New message',
  to: 'cloud@codeware.se'
};

describe('attachSubmissionId', () => {
  it('stamps the submission id as a header', () => {
    const params = { doc: { id: 42 } } as unknown as Args[1];
    const [result] = attachSubmissionId([email], params);

    expect(result.headers).toEqual({ [SUBMISSION_ID_HEADER]: '42' });
  });

  it('stamps every email in the batch', () => {
    const params = { doc: { id: 7 } } as unknown as Args[1];
    const result = attachSubmissionId([email, email], params);

    expect(result).toHaveLength(2);
    expect(result[1].headers).toEqual({ [SUBMISSION_ID_HEADER]: '7' });
  });

  it('keeps headers another beforeEmail already set', () => {
    const params = { doc: { id: 42 } } as unknown as Args[1];
    const withHeader = { ...email, headers: { 'x-existing': 'keep me' } };

    const [result] = attachSubmissionId([withHeader], params);

    expect(result.headers).toEqual({
      'x-existing': 'keep me',
      [SUBMISSION_ID_HEADER]: '42'
    });
  });

  it('leaves the emails alone when the plugin hands no doc at all', () => {
    const params = {} as unknown as Args[1];
    expect(attachSubmissionId([email], params)).toEqual([email]);
  });
});
