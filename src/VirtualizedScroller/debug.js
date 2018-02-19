// @flow

import type { Rendition } from './types';

export const logRendition = <T>(label: string, rendition: Rendition<T>) => {
  console.log(
    label,
    rendition.reduce((obj, { item: { key }, offset }) => {
      obj[key] = offset;
      return obj;
    }, {})
  );
};

export const renditionDigest = <T>(rendition: Rendition<T>) =>
  rendition.reduce((obj, { item: { key }, offset }) => {
    obj[key] = offset;
    return obj;
  }, {});
