// @flow

import Rectangle from './Rectangle';

export interface Viewport {
  listenToScroll(listener: () => void): () => void;
  getRectangle(): Rectangle;
}
