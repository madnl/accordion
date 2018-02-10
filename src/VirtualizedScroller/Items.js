// @flow

export default class Items<T> {
  _items: T[];
  _itemKey: T => string;

  constructor(items: T[], itemKey: T => string) {
    this._items = items;
    this._itemKey = itemKey;
  }

  forEachWithKey(fn: (string, T) => void) {
    const itemKey = this._itemKey;
    this._items.forEach(item => {
      fn(itemKey(item), item);
    });
  }

  mapWithKey<U>(fn: (string, T) => U): U[] {
    const itemKey = this._itemKey;
    return this._items.map(item => fn(itemKey(item), item));
  }
}
