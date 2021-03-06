// @flow

import Layout from './Layout';
import type {
  Rendition,
  List,
  HeightEstimator,
  RenderableItem,
  Item
} from './types';
import collectFirst from '../modules/collectFirst';
import collectLast from '../modules/collectLast';
import collect from '../modules/collect';
import Rectangle from './Rectangle';
import layoutRelaxation from './layoutRelaxation';
import maxBy from '../modules/maxBy';

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

export function normalizeTop<T>(
  layout: Layout,
  list: List<T>,
  heightEstimator: HeightEstimator<T>
): number {
  const result = collectFirst(list, (item, index) => {
    const firstRectangle = layout.getRectangle(item.key);
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
  viewportRect: Rectangle,
  previousRendition: Rendition<T>
): Rendition<T> {
  // TODO(optimize)
  const candidateRendition = collect(list, item => {
    const r = layout.getRectangle(item.key);
    return r && r.doesIntersectWith(viewportRect) && r.top >= 0
      ? renderableItem(item, r)
      : undefined;
  });
  const newlyRendered = new Set(candidateRendition.map(({ item }) => item.key));
  const pastRendered = new Set(previousRendition.map(({ item }) => item.key));
  const removed = collect(
    previousRendition,
    ({ item }) => (!newlyRendered.has(item.key) ? item : undefined)
  );
  const added = candidateRendition.filter(
    ({ item }) => !pastRendered.has(item.key)
  ).length;
  const leaveBehind =
    added === 0 && removed.length > 0
      ? maxBy(removed, ({ key }) => {
          const r = layout.getRectangle(key);
          return r
            ? -Math.abs(r.top - viewportRect.top)
            : Number.NEGATIVE_INFINITY;
        })
      : undefined;
  if (leaveBehind) {
    console.log({ leaveBehindKey: leaveBehind.key });
    const r = layout.getRectangle(leaveBehind.key);
    r && candidateRendition.push(renderableItem(leaveBehind, r));
  }
  return candidateRendition;
}

export function relayoutRendition<T>(
  rendition: Rendition<T>,
  layout: Layout
): Rendition<T> {
  return collect(rendition, ({ item }) => {
    const r = layout.getRectangle(item.key);
    return r && renderableItem(item, r);
  });
}

export function isDenormalizationVisible<T>(
  viewportRect: Rectangle,
  layout: Layout,
  list: List<T>
): boolean {
  const result = collectFirst(list, (item, index) => {
    const r = layout.getRectangle(item.key);
    return (
      r &&
      r.doesIntersectWith(viewportRect) && {
        firstInViewRect: r,
        firstInViewIndex: index
      }
    );
  });
  if (!result) {
    return false;
  }
  const { firstInViewRect, firstInViewIndex } = result;
  return (
    (firstInViewRect && firstInViewRect.top < 0) ||
    (firstInViewIndex === 0 && firstInViewRect.top > 0)
  );
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

export const renderableItem = <T>(
  item: Item<T>,
  rectangle: Rectangle
): RenderableItem<T> => {
  const roundedTop = Math.round(rectangle.top * 100) / 100;
  return { item, offset: roundedTop };
};

export const orderBySalience = <T>(
  rendition: Rendition<T>,
  layout: Layout,
  viewportRect: Rectangle
): Array<string> => {
  const keys = rendition.map(({ item: { key } }) => key);
  keys.sort((key1, key2) => {
    const r1 = layout.getRectangle(key1);
    const r2 = layout.getRectangle(key2);
    if (!r2) {
      return -1;
    } else if (!r1) {
      return 1;
    } else {
      return (
        compareNum(
          positioningGrade(r1, viewportRect),
          positioningGrade(r2, viewportRect)
        ) ||
        compareNum(
          Math.abs(r1.top - viewportRect.top),
          Math.abs(r2.top - viewportRect.top)
        )
      );
    }
  });
  return keys;
};

const positioningGrade = (r, viewportRect) => {
  if (viewportRect.surrounds(r)) {
    return 0;
  } else if (viewportRect.doesIntersectWith(r)) {
    return 1;
  } else {
    return 2;
  }
};

const compareNum = (x: number, y: number) => (x < y ? -1 : x > y ? 1 : 0);
