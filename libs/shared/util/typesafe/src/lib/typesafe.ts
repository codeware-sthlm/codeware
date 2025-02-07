export type DeepRequired<T> = {
  [K in keyof T]-?: Prettify<DeepRequired<T[K]>>;
};

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
