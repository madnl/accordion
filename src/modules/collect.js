// @flow

export default function collect<T, U>(items: T[], fn: (T, number) => ?U): U[] {
  const result: U[] = [];
  for (let i = 0; i < items.length; i++) {
    const r = fn(items[i], i);
    if (r) {
      result.push(r);
    }
  }
  return result;
}
