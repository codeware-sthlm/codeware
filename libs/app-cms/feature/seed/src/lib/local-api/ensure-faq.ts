import type { Faq } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

export type FaqData = {
  answer: { en: string; sv: string };
  question: { en: string; sv: string };
};

/**
 * Ensure that a FAQ entry exists with the given English question.
 *
 * The entry is created with English content and updated
 * with the Swedish translation.
 *
 * @param payload - Payload instance
 * @param data - FAQ data
 * @param options - Seed options
 * @returns The created FAQ entry or the id if the entry exists
 */
export async function ensureFaq(
  payload: Payload,
  data: FaqData,
  options: { transactionID: string | number | undefined }
): Promise<Faq | number> {
  const { transactionID } = options;
  const { answer, question } = data;

  // Check if the FAQ entry exists with the given English question.
  // `question` is localized, so the lookup must run in the same locale the
  // entry is created with, regardless of the configured default locale.
  const faqs = await payload.find({
    collection: 'faq',
    where: { question: { equals: question.en } },
    locale: 'en',
    depth: 0,
    limit: 1,
    req: { transactionID }
  });

  if (faqs.totalDocs) {
    return faqs.docs[0].id;
  }

  // No entry found, create one with English locale

  const faq = await payload.create({
    collection: 'faq',
    data: {
      answer: answer.en,
      question: question.en
    },
    locale: 'en',
    req: { transactionID }
  });

  // and update it with Swedish locale
  await payload.update({
    collection: 'faq',
    id: faq.id,
    data: {
      answer: answer.sv,
      question: question.sv
    },
    locale: 'sv',
    req: { transactionID }
  });

  return faq;
}
