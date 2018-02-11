// @flow

import * as React from 'react';
import Virtualizer from './Virtualizer';
import type { Item, ItemData } from './types';
import type { Viewport } from './Viewport';

const createList = (items, itemKey) =>
  items.map(item => ({ data: item, key: itemKey(item) }));

type Props = {
  items: ItemData[],
  itemKey: ItemData => string,
  renderItem: ItemData => React.Node,
  viewport: Viewport
};

export default class VirtualizedScroller extends React.Component<Props> {
  _list: Item[];

  constructor(props: Props) {
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

  componentWillReceiveProps(nextProps: Props) {
    if (
      this.props.items !== nextProps.items ||
      this.props.itemKey !== nextProps.itemKey
    ) {
      this._list = createList(nextProps.items, nextProps.itemKey);
    }
  }
}
