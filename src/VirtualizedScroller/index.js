// @flow

import * as React from 'react';
import Rectangle from './Rectangle';
import Items from './Items';

type Props<T> = {
  itemKey: T => string,
  items: T[],
  renderItem: T => React.Node
};

type Layout = Map<string, Rectangle>;

const ASSUMED_HEIGHT = 100;

const DEFAULT_POSITION = new Rectangle(0, ASSUMED_HEIGHT);

export default class VirtualizedScroller<T> extends React.Component<Props<T>> {
  _layout: Layout;
  _refs: Map<string, HTMLElement>;
  _items: Items<T>;

  constructor(props: Props<T>) {
    super(props);
    this._items = new Items(props.items, props.itemKey);
    this._layout = initializeLayout(this._items);
    this._refs = new Map();
  }

  componentWillReceiveProps(nextProps: Props<T>) {
    if (
      nextProps.items !== this.props.items ||
      nextProps.itemKey !== this.props.itemKey
    ) {
      this._items = new Items(nextProps.items, nextProps.itemKey);
    }
  }

  render() {
    const { items, renderItem, itemKey } = this.props;
    return (
      <div style={{ position: 'relative' }}>
        {items.map(item => {
          const key = itemKey(item);
          const r = this._positionForItem(key);
          return (
            <div
              key={key}
              ref={elem => this._setRef(key, elem)}
              style={{
                position: 'absolute',
                transform: `translateY(${r.top}px)`,
                width: '100%'
              }}
            >
              {renderItem(item)}
            </div>
          );
        })}
      </div>
    );
  }

  componentDidMount() {
    this._updateLayout();
  }

  componentDidUpdate() {
    this._updateLayout();
  }

  _setRef(key: string, elem: ?HTMLElement) {
    if (elem) {
      this._refs.set(key, elem);
    } else {
      this._refs.delete(key);
    }
  }

  _updateLayout() {
    window.requestAnimationFrame(() => {
      const heightDelta = this._recordLayout();
      console.log({ heightDelta });
      if (heightDelta > 1) {
        relaxLayout(this._items, this._layout);
        this.forceUpdate();
      }
    });
  }

  _recordLayout() {
    let delta = 0;
    this._refs.forEach((elem, key) => {
      const height = elem.getBoundingClientRect().height;
      const r = getOrInitRectangle(this._layout, key);
      delta += Math.abs(r.height - height);
      r.height = height;
    });
    return delta;
  }

  _positionForItem(key: string): Rectangle {
    return this._layout.get(key) || DEFAULT_POSITION;
  }
}

const initializeLayout = items => {
  const layout: Map<string, Rectangle> = new Map(
    items.mapWithKey(key => [key, new Rectangle(0, ASSUMED_HEIGHT)])
  );
  relaxLayout(items, layout);
  return layout;
};

const relaxLayout = (items, layout) => {
  let top = 0;
  items.forEachWithKey(key => {
    const r = getOrInitRectangle(layout, key);
    r.top = top;
    top = r.bottom;
  });
};

const getOrInitRectangle = (layout: Layout, key: string): Rectangle => {
  let r = layout.get(key);
  if (!r) {
    r = new Rectangle(0, ASSUMED_HEIGHT);
    layout.set(key, r);
  }
  return r;
};
