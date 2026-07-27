import type { Post } from '@codeware/shared/util/payload-types';
import type { FieldHook } from 'payload';

export const updatePublishedAtHook: FieldHook<Post, Date, Post> = async ({
  siblingData,
  value
}) => {
  // TODO: Publish support
  // siblingData._status === 'published'

  if (!value) {
    return new Date();
  }

  return value;
};
