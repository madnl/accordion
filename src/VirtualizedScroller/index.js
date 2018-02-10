// @flow

import * as React from 'react';
import Rectangle from './Rectangle';
import Items from './Items';
import type { Viewport } from './Viewport';
import collect from '../modules/collect';

type Props<T> = {
  itemKey: T => string,
  items: T[],
  renderItem: T => React.Node,
  viewport: Viewport
};

type State<T> = {
  rendition: RenderableItem<T>[],
  runwayHeight: number
};

type RenderableItem<T> = {
  item: T,
  offset: number
};

type Layout = Map<string, Rectangle>;

const ASSUMED_HEIGHT = 100;

const DEFAULT_POSITION = new Rectangle(0, ASSUMED_HEIGHT);

export default class VirtualizedScroller<T> extends React.Component<
  Props<T>,
  State<T>
> {
  _layout: Layout;
  _refs: Map<string, HTMLElement>;
  _items: Items<T>;
  _runway: ?HTMLElement;
  _unlistenToScroll: ?() => void;

  constructor(props: Props<T>) {
    super(props);
    this._items = new Items(props.items, props.itemKey);
    this._layout = initializeLayout(this._items);
    this._refs = new Map();
    this._runway = undefined;
    this.state = {
      rendition: [],
      runwayHeight: 0
    };
  }

  componentWillReceiveProps(nextProps: Props<T>) {
    if (
      nextProps.items !== this.props.items ||
      nextProps.itemKey !== this.props.itemKey
    ) {
      this._items = new Items(nextProps.items, nextProps.itemKey);
    }
  }

  shouldComponentUpdate(nextProps: Props<T>, nextState: State<T>) {
    if (this.props.renderItem !== nextProps.renderItem) {
      return true;
    }
    if (this.props.itemKey !== nextProps.itemKey) {
      return true;
    }
    if (this.state.runwayHeight !== nextState.runwayHeight) {
      return true;
    }
    return !isEqualRendition(nextState.rendition, this.state.rendition);
  }

  render() {
    const { renderItem, itemKey } = this.props;
    const { rendition, runwayHeight } = this.state;
    console.log('render', { rendition, runwayHeight });
    return (
      <div
        style={{ position: 'relative', height: `${runwayHeight}px` }}
        ref={elem => {
          this._runway = elem;
        }}
      >
        {rendition.map(({ item, offset }) => {
          const key = itemKey(item);
          return (
            <div
              key={key}
              ref={elem => this._setRef(key, elem)}
              style={{
                position: 'absolute',
                transform: `translateY(${offset}px)`,
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
    this._updateRendition();
    this._unlistenToScroll = this.props.viewport.listenToScroll(
      this._handleScroll
    );
  }

  componentWillUnmount() {
    if (this._unlistenToScroll) {
      this._unlistenToScroll.call();
    }
  }

  componentDidUpdate() {
    this._updateLayout();
    this._updateRendition();
  }

  _updateRendition() {
    if (!this._runway) {
      return;
    }
    const runwayTop = this._runway
      ? this._runway.getBoundingClientRect().top
      : 0;
    const viewportRect = this.props.viewport
      .getRectangle()
      .translateBy(-runwayTop);
    const { items, itemKey } = this.props;
    const nextRendition = collect(items, item => {
      const key = itemKey(item);
      const r = getOrInitRectangle(this._layout, key);
      return r.doesIntersectWith(viewportRect)
        ? { item, offset: r.top }
        : undefined;
    });
    const lastItem = items.length > 0 && items[items.length - 1];
    const runwayHeight = lastItem
      ? getOrInitRectangle(this._layout, itemKey(lastItem)).bottom
      : 0;
    this.setState({ rendition: nextRendition, runwayHeight });
  }

  _setRef(key: string, elem: ?HTMLElement) {
    if (elem) {
      this._refs.set(key, elem);
    } else {
      this._refs.delete(key);
    }
  }

  _handleScroll = () => {
    this._updateRendition();
  };

  _updateLayout() {
    window.requestAnimationFrame(() => {
      const heightDelta = this._recordLayout();
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

const isEqualRendition = (prevRendition, nextRendition) => {
  if (prevRendition.length !== nextRendition.length) {
    return false;
  }
  for (let i = 0; i < prevRendition.length; i++) {
    const prevItem = prevRendition[i];
    const nextItem = nextRendition[i];
    if (
      prevItem.item !== nextItem.item ||
      prevItem.offset !== nextItem.offset
    ) {
      return false;
    }
  }
  return true;
};
