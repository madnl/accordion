import type { List, Rendition } from './types';
import indexBy from '../modules/indexBy';
import maxBy from '../modules/maxBy';

export default <T>(
  list: List<T>,
  currentRendition: Rendition<T>,
  salience: Array<string>
): ?number => {
  const salienceMap = indexBy(
    salience,
    key => key,
    (key, index) => salience.length - index
  );
  const currentKeys = currentRendition.map(item => item.item.key);
  const mostSalientKey = maxBy(currentKeys, key => salienceMap[key] || -1);
  // console.log('findPivotIndex', { salienceMap, mostSalientKey });
  return mostSalientKey ? indexOfKey(list, mostSalientKey) : undefined;
};

const indexOfKey = <T>(list: List<T>, key: string): ?number => {
  const index = list.findIndex(item => item.key === key);
  return index >= 0 ? index : undefined;
};
