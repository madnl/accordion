// @flow

import * as React from 'react';
import Rectangle from './Rectangle';
import type { Viewport } from './Viewport';
import type { Item } from './types';
import collect from '../modules/collect';

type Props<T> = {|
  list: Item<T>[],
  renderItem: T => React.Node,
  viewport: Viewport
|};

type RenderableItem<T> = {
  item: Item<T>,
  offset: number
};

type State<T> = {|
  rendition: RenderableItem<T>[],
  runwayHeight: number
|};

type Layout = Map<string, Rectangle>;

const ASSUMED_HEIGHT = 100;

export default class Virtualizer<T> extends React.Component<
  Props<T>,
  State<T>
> {
  _layout: Layout;
  _refs: Map<string, HTMLElement>;
  _runway: ?HTMLElement;
  _unlistenToScroll: ?() => void;

  constructor(props: Props<T>) {
    super(props);
    this._layout = initializeLayout(props.list);
    this._refs = new Map();
    this._runway = null;
    this.state = {
      rendition: [],
      runwayHeight: 0
    };
  }

  render() {
    const { renderItem } = this.props;
    const { rendition, runwayHeight } = this.state;
    return (
      <div
        style={{ position: 'relative', height: `${runwayHeight}px` }}
        ref={elem => {
          this._runway = elem;
        }}
      >
        {rendition.map(({ item: { data, key }, offset }) => {
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
              {renderItem(data)}
            </div>
          );
        })}
      </div>
    );
  }

  componentWillReceiveProps(nextProps: Props<T>) {
    const { rendition } = this.state;
    const nextItemSet = new Set(nextProps.list.map(item => item.key));
    this.setState({
      rendition: rendition.filter(({ item }) => nextItemSet.has(item.key))
    });
    this._scheduleLayoutUpdate();
  }

  shouldComponentUpdate(nextProps: Props<T>, nextState: State<T>) {
    if (this.props.renderItem !== nextProps.renderItem) {
      return true;
    }
    if (this.state.runwayHeight !== nextState.runwayHeight) {
      return true;
    }
    return !isEqualRendition(nextState.rendition, this.state.rendition);
  }

  componentDidMount() {
    this._unlistenToScroll = this.props.viewport.listenToScroll(
      this._handleScroll
    );
    window.requestAnimationFrame(() => {
      this._updateRendition();
    });
  }

  componentWillUnmount() {
    if (this._unlistenToScroll) {
      this._unlistenToScroll.call();
    }
  }

  componentDidUpdate() {
    this._scheduleLayoutUpdate();
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
    const { list } = this.props;
    const nextRendition = collect(list, item => {
      const r = getOrInitRectangle(this._layout, item.key);
      return r.doesIntersectWith(viewportRect)
        ? { item, offset: r.top }
        : undefined;
    });
    const lastItem = list.length > 0 && list[list.length - 1];
    const runwayHeight = lastItem
      ? getOrInitRectangle(this._layout, lastItem.key).bottom
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
    window.requestAnimationFrame(() => {
      this._updateRendition();
    });
  };

  _scheduleLayoutUpdate() {
    window.requestAnimationFrame(() => {
      const heightDelta = this._recordLayout();
      if (heightDelta > 1) {
        relaxLayout(this.props.list, this._layout);
        this._updateRendition();
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
}

function initializeLayout<T>(list: Item<T>[]): Layout {
  const layout: Map<string, Rectangle> = new Map();
  list.forEach(({ key }) => {
    layout.set(key, new Rectangle(0, ASSUMED_HEIGHT));
  });
  relaxLayout(list, layout);
  return layout;
}

function relaxLayout<T>(list: Item<T>[], layout: Layout): void {
  let top = 0;
  list.forEach(({ key }) => {
    const r = getOrInitRectangle(layout, key);
    r.top = top;
    top = r.bottom;
  });
}

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
      prevItem.item.key !== nextItem.item.key ||
      prevItem.item.data !== nextItem.item.data ||
      prevItem.offset !== nextItem.offset
    ) {
      return false;
    }
  }
  return true;
};
