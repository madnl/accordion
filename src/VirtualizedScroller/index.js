// @flow

import * as React from 'react';

type Props<T> = {
  itemKey: T => string,
  items: T[],
  renderItem: T => React.Node
};

export default class VirtualizedScroller<T> extends React.Component<Props<T>> {
  render() {
    const { items, renderItem, itemKey } = this.props;
    return <div>{items.map(item => <div key={itemKey(item)}>{renderItem(item)}</div>)}</div>;
  }
}
