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

const renderItem = ({ id }: Elem) => (
  <Item color={colorPalette[id % colorPalette.length]} text={String(id)} />
);
const itemKey = (item: Elem) => String(item.id);

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
          <Button onPress={this._handlePrepend} title="Prepend 20 items" />
        </View>
        <VirtualizedScroller
          itemKey={itemKey}
          viewport={windowViewport}
          items={items}
          renderItem={renderItem}
        />
      </View>
    );
  }

  _handlePrepend = () => {
    const { items } = this.state;
    this.setState({
      items: [...createItemList(items.length, items.length + 20), ...items]
    });
  };
}

const colorPalette = [
  'rgb(216, 17, 89)',
  'rgb(143, 45, 86)',
  'rgb(33, 131, 128)',
  'rgb(251, 177, 60)',
  'rgb(115, 210, 222)'
];

const createItemList = (indexStart, indexEnd) =>
  [...Array(indexEnd - indexStart).keys()].map(index => ({
    id: index + indexStart
  }));
