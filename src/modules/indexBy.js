// @flow

export default function indexBy<T, V>(
  items: Array<T>,
  keyFunc: (item: T, index: number) => string | number,
  valueFunc: (item: T, index: number) => V
): { [string | number]: V } {
  const obj: { [string | number]: V } = {};
  items.forEach((item, index) => {
    const key = keyFunc(item, index);
    const value = valueFunc(item, index);
    obj[key] = value;
  });
  return obj;
}
