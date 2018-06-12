// @flow

import * as React from 'react';
import type { Rendition } from './types';
import renderCell from './renderCell';
import collect from '../modules/collect';

type Props<T> = {|
  renderItem: (item: T) => React.Node,
  rendition: Rendition<T>,
  cellRef: (key: string, ref: ?HTMLDivElement) => void
|};

type Slot = number;
type Key = string;

export default class RecyclingContainer<T> extends React.Component<Props<T>> {
  _assignment: Map<Key, Slot>;
  _slotGen: () => Slot;

  constructor(props: Props<T>) {
    super(props);
    this._slotGen = slotGenerator();
    this._assignment = new Map(
      props.rendition.map(item => [item.item.key, this._slotGen()])
    );
  }

  componentWillReceiveProps(props: Props<T>) {
    // TODO(optimize)
    if (this.props.rendition !== props.rendition) {
      const newItems = new Set(props.rendition.map(({ item }) => item.key));
      const recycledSlots = collect(
        [...this._assignment],
        ([key, slot]) => (!newItems.has(key) ? slot : undefined)
      );
      const nextAssignment = new Map(
        props.rendition.map(({ item: { key } }) => {
          const current = this._assignment.get(key);
          let slot: Slot;
          if (current) {
            slot = current;
          } else if (recycledSlots.length > 0) {
            slot = recycledSlots.pop();
          } else {
            slot = this._slotGen();
          }
          return [key, slot];
        })
      );
      this._assignment = nextAssignment;
    }
  }

  render() {
    const { rendition, renderItem, cellRef } = this.props;
    return rendition.map(renderableItem =>
      renderCell(
        renderableItem,
        renderItem,
        this._assignment.get(renderableItem.item.key) ||
          renderableItem.item.key,
        elem => cellRef(renderableItem.item.key, elem)
      )
    );
  }
}

const slotGenerator = () => {
  let counter = 1;
  return () => counter++;
};
