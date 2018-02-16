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

  doesIntersectWith(another: Rectangle): boolean {
    return (
      this.contains(another.top) ||
      this.contains(another.bottom) ||
      another.contains(this.top)
    );
  }

  contains(point: number): boolean {
    return this.top <= point && point < this.bottom;
  }

  translatedBy(offset: number): Rectangle {
    return new Rectangle(this.top + offset, this.height);
  }

  surrounds(another: Rectangle): boolean {
    return this.top <= another.top && this.bottom >= another.bottom;
  }
}
