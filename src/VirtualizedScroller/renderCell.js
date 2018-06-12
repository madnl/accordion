// @flow

import * as React from 'react';
import type { RenderableItem } from './types';
import Cell from './Cell';

/* eslint-disable react/display-name */
export default <T>(
  item: RenderableItem<T>,
  renderItem: T => React.Node,
  key: string | number,
  ref: (?HTMLDivElement) => void
) => (
  <div
    key={key}
    ref={ref}
    style={{
      position: 'absolute',
      transform: `translateY(${item.offset}px)`,
      width: '100%'
    }}
  >
    <Cell renderItem={renderItem} data={item.item.data} />
  </div>
);
