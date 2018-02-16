// @flow

import * as React from 'react';
import VirtualizedScroller from '../VirtualizedScroller';
import windowViewport from '../VirtualizedScroller/windowViewport';
import Item from './Item';
import { View, Button } from 'react-native-web';

type Elem = {
  id: number
};

type Props = {
  initialCount: number
};

type State = {
  items: Elem[]
};

const itemKey = (item: Elem) => String(item.id);

const PREPEND_COUNT = 2;

export default class TestBench extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      items: createItemList(0, props.initialCount)
    };
  }

  render() {
    const { items } = this.state;
    return (
      <View>
        <View>
          <Button
            onPress={this._handlePrepend}
            title={`Prepend ${PREPEND_COUNT} items`}
          />
        </View>
        <VirtualizedScroller
          itemKey={itemKey}
          viewport={windowViewport}
          items={items}
          renderItem={this._renderItem}
        />
      </View>
    );
  }

  _renderItem = ({ id }: Elem) => {
    return (
      <Item
        id={id}
        onInsertAbove={this._handleInsertAbove}
        onInsertBelow={this._handleInsertBelow}
      />
    );
  };

  _handleInsertAbove = (id: number) => {
    this._insertAtIndex(this.state.items.findIndex(elem => elem.id === id));
  };

  _handleInsertBelow = (id: number) => {
    this._insertAtIndex(this.state.items.findIndex(elem => elem.id === id) + 1);
  };

  _insertAtIndex = (index: number) => {
    const { items } = this.state;
    const newItem = { id: items.length };
    this.setState({
      items: [...items.slice(0, index), newItem, ...items.slice(index)]
    });
  };

  _handlePrepend = () => {
    const { items } = this.state;
    this.setState({
      items: [
        ...createItemList(items.length, items.length + PREPEND_COUNT),
        ...items
      ]
    });
  };
}

const createItemList = (indexStart, indexEnd) =>
  [...Array(indexEnd - indexStart).keys()].map(index => ({
    id: index + indexStart
  }));
