// @flow

import * as React from 'react';
import Virtualizer from './Virtualizer';
import type { Item } from './types';
import type { Viewport } from './Viewport';

function createList<A>(items: A[], itemKey: A => string): Item<A>[] {
  return items.map(item => ({ data: item, key: itemKey(item) }));
}

type Props<T> = {
  items: T[],
  itemKey: T => string,
  renderItem: T => React.Node,
  viewport: Viewport
};

export default class VirtualizedScroller<T> extends React.Component<Props<T>> {
  _list: Item<T>[];

  constructor(props: Props<T>) {
    super(props);
    this._list = createList(props.items, props.itemKey);
  }

  render() {
    const { viewport, renderItem } = this.props;
    return (
      <Virtualizer
        viewport={viewport}
        list={this._list}
        renderItem={renderItem}
      />
    );
  }

  componentWillReceiveProps(nextProps: Props<T>) {
    if (
      this.props.items !== nextProps.items ||
      this.props.itemKey !== nextProps.itemKey
    ) {
      this._list = createList(nextProps.items, nextProps.itemKey);
    }
  }
}
