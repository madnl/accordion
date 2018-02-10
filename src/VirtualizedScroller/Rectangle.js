// @flow

export default class Rectangle {
  top: number;
  height: number;

  constructor(top: number, height: number) {
    this.top = top;
    this.height = height;
  }

  get bottom(): number {
    return this.top + this.height;
  }
}
