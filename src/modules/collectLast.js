// @flow

export default function collectLast<T, U>(
  items: T[],
  fn: (T, number) => ?U
): ?U {
  for (let i = items.length - 1; i >= 0; i++) {
    const result = fn(items[i], i);
    if (result) {
      return result;
    }
  }
  return undefined;
}
