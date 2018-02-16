// @flow

import * as React from 'react';
import type { Viewport } from './Viewport';
import type { Item, Rendition } from './types';
import Cell from './Cell';
import * as Helper from './helper';
import Scheduler from '../modules/Scheduler';
import Layout from './Layout';
import layoutRelaxation from './layoutRelaxation';

type Props<T> = {|
  list: Item<T>[],
  renderItem: T => React.Node,
  viewport: Viewport
|};

type State<T> = {|
  rendition: Rendition<T>,
  runwayHeight: number
|};

type UpdateOptions = {
  syncHeights?: boolean,
  relaxLayout?: boolean,
  updateRendition?: boolean,
  pivotPreference?: Set<string>
};

const HEIGHT_ESTIMATOR = () => 100;

const EMPTY_SET = new Set();

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
    this._layout = new Layout();
    layoutRelaxation(props.list, 0, this._layout, HEIGHT_ESTIMATOR);
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
    this.setState({
      rendition: Helper.pruneMissing(rendition, nextProps.list)
    });
    this._scheduleUpdateInNextFrame({
      relaxLayout: true,
      updateRendition: true
    });
  }

  shouldComponentUpdate(nextProps: Props<T>, nextState: State<T>) {
    if (this.props.renderItem !== nextProps.renderItem) {
      return true;
    }
    if (this.state.runwayHeight !== nextState.runwayHeight) {
      return true;
    }
    return !Helper.isEqualRendition(nextState.rendition, this.state.rendition);
  }

  componentDidMount() {
    this._unlistenToScroll = this.props.viewport.listenToScroll(
      this._handleScroll
    );
    this._scheduleUpdateInNextFrame({
      relaxLayout: true,
      updateRendition: true
    });
  }

  componentWillUnmount() {
    if (this._unlistenToScroll) {
      this._unlistenToScroll.call();
    }
  }

  componentDidUpdate(prevProps: Props<T>, prevState: State<T>) {
    this._scheduleUpdateInNextFrame({
      syncHeights: true,
      pivotPreference: Helper.renditionKeys(prevState.rendition)
    });
  }

  _update(options: UpdateOptions) {
    const viewportRect = this._relativeViewRect();
    if (!viewportRect) {
      return;
    }
    const { list } = this.props;
    let heightsChanged = false;
    let layoutChanged = false;
    let scrollAdjustment = 0;
    let nextState: { rendition?: Rendition<T>, runwayHeight?: number } = {};
    if (options.syncHeights) {
      heightsChanged = this._recordHeights();
    }
    if (options.relaxLayout || heightsChanged) {
      // TODO: get previous rendition
      const pivotIndex =
        Helper.findPivotIndex(
          list,
          this.state.rendition,
          options.pivotPreference || EMPTY_SET
        ) || 0;
      // const renditionKeySet = Helper.renditionKeys(this.state.rendition);
      // const firstVisibleIndex = list.findIndex(({ key }) =>
      //   renditionKeySet.has(key)
      // );
      // const pivotIndex = firstVisibleIndex >= 0 ? firstVisibleIndex : 0;
      layoutRelaxation(list, pivotIndex, this._layout, HEIGHT_ESTIMATOR);
      // TODO: we can actually check if this is true
      layoutChanged = true;
    }
    if (
      Helper.isDenormalizationVisible(viewportRect, this._layout, list) ||
      (options.quiescent && Helper.isTopDenormalized(this._layout, list))
    ) {
      scrollAdjustment = Helper.normalizeTop(
        this._layout,
        list,
        HEIGHT_ESTIMATOR
      );
      layoutChanged = layoutChanged || scrollAdjustment > 0;
    }
    if (layoutChanged) {
      nextState.runwayHeight = Helper.runwayHeight(this._layout, list);
    }
    if (options.updateRendition || layoutChanged) {
      nextState.rendition = options.updateRendition
        ? Helper.calculateRendition(
            this._layout,
            list,
            viewportRect.translatedBy(scrollAdjustment)
          )
        : Helper.relayoutRendition(this.state.rendition, this._layout);
    }
    // TODO: magic constant
    const shouldAdjustScroll = Math.abs(scrollAdjustment) > 3;
    if (nextState.rendition || nextState.runwayHeight) {
      this.setState(nextState, () => {
        if (shouldAdjustScroll) {
          this.props.viewport.scrollBy(scrollAdjustment);
        }
      });
    } else if (shouldAdjustScroll) {
      this.props.viewport.scrollBy(scrollAdjustment);
    }
  }

  _scheduleUpdateInNextFrame = Scheduler(
    window.requestAnimationFrame,
    options => this._update(options),
    (prev, next) => ({ ...prev, ...next })
  );

  _setRef(key: string, elem: ?HTMLElement) {
    if (elem) {
      this._refs.set(key, elem);
    } else {
      this._refs.delete(key);
    }
  }

  _handleScroll = () => {
    this._scheduleUpdateInNextFrame({
      updateRendition: true
    });
  };

  _relativeViewRect() {
    const runwayRect = this._runway && this._runway.getBoundingClientRect();
    return (
      runwayRect &&
      this.props.viewport.getRectangle().translatedBy(-runwayRect.top)
    );
  }

  _recordHeights(): boolean {
    let changed = false;
    this._refs.forEach((elem, key) => {
      const height = elem.getBoundingClientRect().height;
      const heightUpdated = this._layout.updateHeight(key, height);
      changed = changed || heightUpdated;
    });
    return changed;
  }
}
