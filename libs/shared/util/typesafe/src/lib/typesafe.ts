export type DeepRequired<T> = {
  [K in keyof T]-?: Prettify<DeepRequired<T[K]>>;
};

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Strip types from a type
 *
 * @example
 * type Stripped = StripTypes<{ a: number | null }, null>
 * // { a: number }
 */
export type StripTypes<T, U> = T extends U ? never : T;
