import { isObject } from './is-object';

type KeyValue = Record<string, unknown>;

/**
 * A deterministic deep merge of two objects.
 *
 * Type inference defaults to the target type but that can easily be customized
 * by providing your own types for the properties and return type.
 *
 * Limitations:
 * - Does not support merging arrays.
 *
 * @param target - The target object acting as the master object.
 * @param source - The source object to merge into the target.
 * @returns A new object containing the merged properties of both objects.
 */
export const deepMerge = <
  TTarget extends KeyValue,
  TSource extends KeyValue = Partial<TTarget>,
  TReturn extends KeyValue = TTarget
>(
  target: TTarget,
  source: TSource
): TReturn => {
  const output = { ...target } as KeyValue;

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(
            target[key] as KeyValue,
            source[key] as KeyValue
          );
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output as TReturn;
};
