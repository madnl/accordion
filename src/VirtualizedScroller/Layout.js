// @flow

import Rectangle from './Rectangle';

export default class Layout {
  _rectangles: Map<string, Rectangle> = new Map();

  updateHeight(key: string, height: number): boolean {
    let r = this._rectangles.get(key);
    if (!r) {
      r = new Rectangle(0, 0);
      this._rectangles.set(key, r);
    }
    const prevHeight = r.height;
    r.height = height;
    return prevHeight !== height;
  }

  setRectangle(key: string, rectangle: Rectangle) {
    this._rectangles.set(key, rectangle);
  }

  initialize(key: string, height: number): Rectangle {
    const r = new Rectangle(0, height);
    this._rectangles.set(key, r);
    return r;
  }

  getRectangle(key: string): ?Rectangle {
    return this._rectangles.get(key);
  }
}
