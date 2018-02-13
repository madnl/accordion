// @flow

import Rectangle from './Rectangle';

export interface Viewport {
  listenToScroll(listener: () => void): () => void;
  scrollBy(offset: number): void;
  getRectangle(): Rectangle;
}
