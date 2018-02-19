// @flow

import * as React from 'react';
import type { Viewport } from './Viewport';
import type { Item, Rendition } from './types';
import Cell from './Cell';
import * as Helper from './helper';
import Scheduler from '../modules/Scheduler';
import Layout from './Layout';
import layoutRelaxation from './layoutRelaxation';
import findPivotIndex from './findPivotIndex';
import * as Debug from './debug';

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
  pivotPreference?: Array<string>
};

const HEIGHT_ESTIMATOR = () => 100;

export default class Virtualizer<T> extends React.Component<
  Props<T>,
  State<T>
> {
  _layout: Layout;
  _refs: Map<string, HTMLElement>;
  _runway: ?HTMLElement;
  _unlistenToScroll: ?() => void;
  _previousSalience: Array<string> = [];

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

  componentDidUpdate() {
    console.log(
      'componentDidUpdate',
      Debug.renditionDigest(this.state.rendition)
    );
    this._scheduleUpdateInNextFrame({
      syncHeights: true
    });
  }

  _update(options: UpdateOptions) {
    let viewportRect = this._relativeViewRect();
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
      const pivotIndex =
        findPivotIndex(list, this.state.rendition, this._previousSalience) || 0;
      // console.log('_update/relax', { pivotIndex });
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
      scrollAdjustment && console.log('normalizing', { scrollAdjustment });
      layoutChanged = layoutChanged || scrollAdjustment > 0;
    }
    if (scrollAdjustment > 0) {
      viewportRect = viewportRect.translatedBy(scrollAdjustment);
    }
    if (layoutChanged) {
      nextState.runwayHeight = Math.ceil(
        Helper.runwayHeight(this._layout, list)
      );
    }
    if (options.updateRendition || layoutChanged) {
      nextState.rendition = options.updateRendition
        ? Helper.calculateRendition(this._layout, list, viewportRect)
        : Helper.relayoutRendition(this.state.rendition, this._layout);
    }
    // TODO: magic constant
    const shouldAdjustScroll = Math.abs(scrollAdjustment) > 3;
    if (nextState.rendition) {
      this._previousSalience = Helper.orderBySalience(
        nextState.rendition,
        this._layout,
        viewportRect
      );
    }
    if (nextState.rendition || nextState.runwayHeight) {
      // Debug.logRendition('rendition update', nextState.rendition || []);
      this.setState(nextState, () => {
        if (shouldAdjustScroll) {
          this.props.viewport.scrollBy(scrollAdjustment);
        }
      });
    } else if (shouldAdjustScroll) {
      console.log('No rendition update');
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
