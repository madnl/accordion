// @flow

import Layout from './Layout';
import type { Rendition, List, HeightEstimator } from './types';
import collectFirst from '../modules/collectFirst';
import collectLast from '../modules/collectLast';
import collect from '../modules/collect';
import Rectangle from './Rectangle';
import layoutRelaxation from './layoutRelaxation';

export function pruneMissing<T>(
  rendition: Rendition<T>,
  list: List<T>
): Rendition<T> {
  const keySet = new Set(list.map(({ key }) => key));
  return rendition.filter(({ item: { key } }) => keySet.has(key));
}

export function renditionKeys<T>(rendition: Rendition<T>): Set<string> {
  return new Set(rendition.map(({ item: { key } }) => key));
}

export function findPivotIndex<T>(
  list: List<T>,
  currentRendition: Rendition<T>,
  previousRendition: Rendition<T>
): ?number {
  const currentRendered = renditionKeys(currentRendition);
  const previouslyRendered = renditionKeys(previousRendition);
  const index = list.findIndex(
    ({ key }) => previouslyRendered.has(key) && currentRendered.has(key)
  );
  return index >= 0 ? index : undefined;
}

export function normalizeTop<T>(
  layout: Layout,
  list: List<T>,
  heightEstimator: HeightEstimator<T>
): number {
  const result = collectFirst(list, (item, index) => {
    const firstRectangle = this._layout.get(item.key);
    return firstRectangle && { firstRectangle, index };
  });
  if (!result) {
    return 0;
  }
  const { firstRectangle, index } = result;
  if (firstRectangle.top === 0) {
    return 0;
  }
  const shift = -firstRectangle.top;
  firstRectangle.top = 0;
  layoutRelaxation(list, index, layout, heightEstimator);
  return shift;
}

export function calculateRendition<T>(
  layout: Layout,
  list: List<T>,
  viewportRect: Rectangle
): Rendition<T> {
  console.log('calculateRendition', { layout, list, viewportRect });
  return collect(list, item => {
    const r = layout.getRectangle(item.key);
    return r && r.doesIntersectWith(viewportRect) && r.top >= 0
      ? { item, offset: r.top }
      : undefined;
  });
}

export function relayoutRendition<T>(
  rendition: Rendition<T>,
  layout: Layout
): Rendition<T> {
  return collect(rendition, ({ item }) => {
    const r = layout.getRectangle(item.key);
    return r && { item, offset: r.top };
  });
}

export function isDenormalizationVisible<T>(
  viewportRect: Rectangle,
  layout: Layout,
  list: List<T>
): boolean {
  const result = collectFirst(list, item => {
    const r = layout.getRectangle(item.key);
    return (
      r &&
      r.doesIntersectWith(viewportRect) && {
        firstInViewRect: r,
        firstInViewIndex
      }
    );
  });
  if (!result) {
    return false;
  }
  const { firstInViewRect, firstInViewIndex } = result;
  return (firstInViewRect && firstInViewRect.top < 0) || firstInViewIndex === 0;
}

export function isTopDenormalized<T>(layout: Layout, list: List<T>): boolean {
  const firstRectangle = collectFirst(list, item =>
    layout.getRectangle(item.key)
  );
  return !!firstRectangle && firstRectangle.top < 0;
}

export function isEqualRendition<T>(
  prevRendition: Rendition<T>,
  nextRendition: Rendition<T>
): boolean {
  if (prevRendition.length !== nextRendition.length) {
    return false;
  }
  for (let i = 0; i < prevRendition.length; i++) {
    const prevItem = prevRendition[i];
    const nextItem = nextRendition[i];
    if (
      prevItem.item.key !== nextItem.item.key ||
      prevItem.item.data !== nextItem.item.data ||
      prevItem.offset !== nextItem.offset
    ) {
      return false;
    }
  }
  return true;
}

export function runwayHeight<T>(layout: Layout, list: List<T>): number {
  const lastRectangle = collectLast(list, item =>
    layout.getRectangle(item.key)
  );
  return lastRectangle ? lastRectangle.bottom : 0;
}
