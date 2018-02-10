// @flow

import * as React from 'react';
import VirtualizedScroller from '../VirtualizedScroller';
import windowViewport from '../VirtualizedScroller/windowViewport';
import Item from './Item';

type ItemData = {
  id: number
};

type Props = {
  initialCount: number
};

type State = {
  items: ItemData[]
};

const renderItem = ({ id }: ItemData) => (
  <Item color={colorPalette[id % colorPalette.length]} text={String(id)} />
);
const itemKey = (item: ItemData) => String(item.id);

export default class TestBench extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      items: createItemList(props.initialCount)
    };
  }

  render() {
    const { items } = this.state;
    return (
      <div>
        <VirtualizedScroller
          itemKey={itemKey}
          viewport={windowViewport}
          items={items}
          renderItem={renderItem}
        />
      </div>
    );
  }
}

const colorPalette = [
  'rgb(216, 17, 89)',
  'rgb(143, 45, 86)',
  'rgb(33, 131, 128)',
  'rgb(251, 177, 60)',
  'rgb(115, 210, 222)'
];

const createItemList = count =>
  [...Array(count).keys()].map(index => ({ id: index }));
