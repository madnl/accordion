// @flow

export default function collectFirst<T, U>(
  items: T[],
  fn: (T, number) => ?U
): ?U {
  for (let i = 0; i < items.length; i++) {
    const result = fn(items[i], i);
    if (result) {
      return result;
    }
  }
  return undefined;
}
