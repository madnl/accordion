// @flow

import type { List, HeightEstimator } from './types';
import type Layout from './Layout';

export default function layoutRelaxation<T>(
  list: List<T>,
  pivotIndex: number,
  layout: Layout,
  heightEstimator: HeightEstimator<T>
) {
  const pivot = list[pivotIndex];
  if (!pivot) {
    return;
  }

  const rectangleForItem = item =>
    layout.getRectangle(item.key) ||
    layout.initialize(item.key, heightEstimator(item.data));

  const pivotRectangle = rectangleForItem(pivot);

  let top = pivotRectangle.bottom;
  for (let i = pivotIndex + 1; i < list.length; i++) {
    const item = list[i];
    const r = rectangleForItem(item);
    r.top = top;
    top = r.bottom;
  }
  let bottom = pivotRectangle.top;
  for (let i = pivotIndex - 1; i >= 0; i--) {
    const item = list[i];
    const r = rectangleForItem(item);
    r.top = bottom - r.height;
    bottom = r.top;
  }
}
