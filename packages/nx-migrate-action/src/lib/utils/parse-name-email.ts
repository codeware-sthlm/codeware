/**
 * Parse the name and email address from a string.
 *
 * Empty string is allowed which will return empty name and email.
 *
 * Pattern: `Name <user@domain.io>`
 *
 * @param text The text to parse
 * @returns The name and email address
 * @throws If a text is provided and doesn't follow the pattern
 */
export const parseNameEmail = (
  text: string
): { name: string; email: string } => {
  if (!text) {
    return {
      name: '',
      email: ''
    };
  }

  let name = '';
  let email = '';

  const nameEmailPattern = /^([^;<\s][^<]{0,254})(?:\s{0,10})<([^>]{1,256})>$/;
  const match = text.match(nameEmailPattern);

  if (match) {
    name = match[1].trim();
    email = match[2].trim();
  }

  if (!name || !email) {
    throw new Error(
      `'${text}' is not following the pattern 'Name <user@domain.io>'`
    );
  }

  return {
    name: name,
    email: email
  };
};
