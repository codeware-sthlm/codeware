/** Whether a string is empty, absent, or contains only whitespace */
export const isBlank = (value: string | null | undefined): boolean =>
  !value?.trim();
