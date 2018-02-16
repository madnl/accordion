// @flow

export default function maxBy<T>(items: Array<T>, crit: T => number): ?T {
  if (items.length > 0) {
    let best = items[0];
    let max = crit(best);
    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const v = crit(item);
      if (v > max) {
        best = item;
        max = v;
      }
    }
    return best;
  }
  return undefined;
}
