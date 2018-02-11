// @flow

import * as React from 'react';

type Props<T> = {
  data: T,
  renderItem: T => React.Node
};

export default class Cell<T> extends React.Component<Props<T>> {
  shouldComponentUpdate(nextProps: Props<T>) {
    // TODO: make this check customizable
    return (
      this.props.data !== nextProps.data ||
      this.props.renderItem !== nextProps.renderItem
    );
  }

  render() {
    const { renderItem, data } = this.props;
    return renderItem(data);
  }
}
