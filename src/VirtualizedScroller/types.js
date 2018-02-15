// @flow

export type Item<T> = {
  data: T,
  key: string
};

export type List<T> = Item<T>[];

export type RenderableItem<T> = {
  item: Item<T>,
  offset: number
};

export type Rendition<T> = RenderableItem<T>[];

export type HeightEstimator<T> = T => number;
