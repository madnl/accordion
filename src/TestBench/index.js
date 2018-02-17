// @flow

import * as React from 'react';
import VirtualizedScroller from '../VirtualizedScroller';
import windowViewport from '../VirtualizedScroller/windowViewport';
import Item from './Item';
import { View } from 'react-native-web';
import AppLayout from './AppLayout';
import ControlPanel from './ControlPanel';

type Elem = {
  id: number
};

type Props = {
  initialCount: number
};

type State = {
  items: Elem[],
  intervalId: ?number
};

const itemKey = (item: Elem) => String(item.id);

const PREPEND_COUNT = 2;

export default class TestBench extends React.Component<Props, State> {
  _idGen = createIdGen();

  constructor(props: Props) {
    super(props);
    this.state = {
      items: createItemList(props.initialCount, this._idGen),
      intervalId: undefined
    };
  }

  render() {
    const { items, intervalId } = this.state;
    return (
      <AppLayout
        header={
          <View>
            <ControlPanel
              itemCount={items.length}
              onPrepend={this._handlePrepend}
              onStreamToggle={this._handleStreamToggle}
              prependCount={PREPEND_COUNT}
              streamRunning={!!intervalId}
            />
          </View>
        }
      >
        <VirtualizedScroller
          itemKey={itemKey}
          viewport={windowViewport}
          items={items}
          renderItem={this._renderItem}
        />
      </AppLayout>
    );
  }

  _renderItem = ({ id }: Elem) => {
    return (
      <Item
        id={id}
        onInsertAbove={this._handleInsertAbove}
        onInsertBelow={this._handleInsertBelow}
        onRemove={this._handleRemove}
      />
    );
  };

  _handleInsertAbove = (id: number) => {
    this._insertAtIndex(this.state.items.findIndex(elem => elem.id === id));
  };

  _handleInsertBelow = (id: number) => {
    this._insertAtIndex(this.state.items.findIndex(elem => elem.id === id) + 1);
  };

  _handleRemove = (id: number) => {
    this.setState({ items: this.state.items.filter(item => item.id !== id) });
  };

  _insertAtIndex = (index: number) => {
    const { items } = this.state;
    const newItem = { id: this._idGen.call() };
    this.setState({
      items: [...items.slice(0, index), newItem, ...items.slice(index)]
    });
  };

  _handlePrepend = (count: number) => {
    const { items } = this.state;
    this.setState({
      items: [...createItemList(count, this._idGen), ...items]
    });
  };

  _handleStreamToggle = () => {
    const { intervalId } = this.state;
    if (intervalId) {
      window.clearInterval(intervalId);
    } else {
      const intervalId = window.setInterval(() => {
        this._insertAtIndex(0);
      }, 1000);
      this.setState({ intervalId });
    }
  };
}

const createIdGen = () => {
  let counter = 0;
  return () => {
    return counter++;
  };
};

const createItemList = (times, idGen: () => number): Elem[] => {
  const result = [];
  for (let i = 0; i < times; i++) {
    result[i] = { id: idGen() };
  }
  return result;
};
