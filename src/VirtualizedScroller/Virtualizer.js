// @flow

import * as React from 'react';
import Rectangle from './Rectangle';
import type { Viewport } from './Viewport';
import type { Item } from './types';
import collect from '../modules/collect';
import collectLast from '../modules/collectLast';
import Cell from './Cell';
import collectFirst from '../modules/collectFirst';

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
    // TODO: remove
    window.v = this;
  }

  render() {
    const { renderItem } = this.props;
    const { rendition, runwayHeight } = this.state;
    // console.log(
    //   'render',
    //   rendition.map(({ item: { key }, offset }) => ({ key, offset }))
    // );
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
              <Cell renderItem={renderItem} data={data} />
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
    window.requestAnimationFrame(() => {
      this._relaxLayout(renditionKeys(rendition));
    });
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

  componentDidUpdate(prevProps: Props<T>, prevState: State<T>) {
    this._scheduleLayoutUpdate(renditionKeys(prevState.rendition));
  }

  _updateRendition() {
    const viewportRect = this._relativeViewRect();
    if (!viewportRect) {
      return;
    }
    const { list } = this.props;
    const nextRendition = collect(list, item => {
      const r = this._layout.get(item.key);
      return r && r.doesIntersectWith(viewportRect) && r.top >= 0
        ? { item, offset: r.top }
        : undefined;
    });
    const lastRectangle = collectLast(list, ({ key }) => this._layout.get(key));
    const runwayHeight = lastRectangle ? lastRectangle.bottom : 0;
    // console.log('_updateRendition', { viewportRect });
    // !isEqualRendition(this.state.rendition, nextRendition) &&
    //   printRenditionSummary('_updateRendition/set', nextRendition);
    this.setState({ rendition: nextRendition, runwayHeight });
  }

  _relayoutRendition() {
    const nextRendition = collect(this.state.rendition, ({ item }) => {
      const r = this._layout.get(item.key);
      return r && { item, offset: r.top };
    });
    // !isEqualRendition(this.state.rendition, nextRendition) &&
    //   printRenditionSummary('_updateRenditionPositions/set', nextRendition);
    this.setState({ rendition: nextRendition });
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
      if (this._shouldNormalize()) {
        this._normalizeTop();
      } else {
        this._updateRendition();
      }
    });
  };

  _relativeViewRect() {
    const runwayRect = this._runway && this._runway.getBoundingClientRect();
    return (
      runwayRect &&
      this.props.viewport.getRectangle().translateBy(-runwayRect.top)
    );
  }

  _shouldNormalize() {
    const viewRect = this._relativeViewRect();
    if (!viewRect) {
      return;
    }
    const { list } = this.props;
    const result = collectFirst(list, item => {
      const r = this._layout.get(item.key);
      return (
        r &&
        r.doesIntersectWith(viewRect) && {
          firstInViewRect: r,
          firstInViewIndex
        }
      );
    });
    // console.log('_shouldNormalize', {
    //   ...result,
    //   viewRect,
    //   first: this._layout.get(list[0].key)
    // });
    if (!result) {
      return;
    }
    const { firstInViewRect, firstInViewIndex } = result;
    return (
      (firstInViewRect && firstInViewRect.top < 0) || firstInViewIndex === 0
    );
  }

  _scheduleLayoutUpdate(pivotCandidates: Set<string>) {
    window.requestAnimationFrame(() => {
      const heightDelta = this._recordHeights();
      if (heightDelta > 1) {
        this._relaxLayout(pivotCandidates);
      }
    });
  }

  _relaxLayout(pivotCandidates: Set<string>) {
    const { list } = this.props;
    if (list.length > 0) {
      const { rendition } = this.state;
      const currentRendered = renditionKeys(rendition);
      const firstCommonIndex = list.findIndex(
        ({ key }) => pivotCandidates.has(key) && currentRendered.has(key)
      );
      const pivotIndex = firstCommonIndex >= 0 ? firstCommonIndex : 0;
      console.log('_relaxLayout', { key: list[pivotIndex].key });
      relaxLayout(this.props.list, this._layout, pivotIndex);
      this._updateRendition();
    }
  }

  _normalizeTop() {
    const { list } = this.props;
    const result = collectFirst(list, (item, index) => {
      const firstRectangle = this._layout.get(item.key);
      return firstRectangle && { firstRectangle, index };
    });
    if (!result) {
      return;
    }
    const { firstRectangle, index } = result;
    if (firstRectangle.top === 0) {
      return;
    }
    const shift = -firstRectangle.top;
    firstRectangle.top = 0;
    relaxLayout(list, this._layout, index);
    // console.log(list.map(({ key }) => ({ key, r: this._layout.get(key) })));
    this._relayoutRendition();
    // console.log('scrollBy', shift);
    this.props.viewport.scrollBy(shift);
  }

  _recordHeights() {
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
  relaxLayout(list, layout, 0);
  return layout;
}

function relaxLayout<T>(
  list: Item<T>[],
  layout: Layout,
  pivotIndex: number
): void {
  const pivotRectangle = layout.get(list[pivotIndex].key);
  if (!pivotRectangle) {
    return;
  }
  let top = pivotRectangle.bottom;
  for (let i = pivotIndex + 1; i < list.length; i++) {
    const item = list[i];
    const r = getOrInitRectangle(layout, item.key);
    r.top = Math.ceil(top);
    top = r.bottom;
  }
  let bottom = pivotRectangle.top;
  for (let i = pivotIndex - 1; i >= 0; i--) {
    const item = list[i];
    const r = getOrInitRectangle(layout, item.key);
    r.top = Math.floor(bottom - r.height);
    bottom = r.top;
  }
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

function renditionKeys<T>(rendition: RenderableItem<T>[]): Set<string> {
  return new Set(rendition.map(({ item: { key } }) => key));
}

function printRenditionSummary<T>(
  title: string,
  rendition: RenderableItem<T>[]
) {
  const obj = new Map(
    rendition.map(({ item: { key }, offset }) => [key, offset])
  );
  console.log(title, obj);
}
