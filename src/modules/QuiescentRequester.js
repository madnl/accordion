// @flow

import debounce from 'lodash.debounce';
import IdGenerator from './IdGenerator';

type Callback = () => void;

type Options = {|
  waitMs: number
|};

export default class QuiescentRequester {
  _queue: Map<number, Callback>;
  _idGen: () => number;
  signalWork: () => void;

  constructor({ waitMs }: Options) {
    this._queue = new Map();
    this._idGen = IdGenerator();
    this.signalWork = debounce(() => this._invokeCallbacks(), waitMs);
  }

  _invokeCallbacks() {
    const callbacks = this._queue;
    this._queue = new Map();
    callbacks.forEach(callback => callback());
  }

  request = (callback: Callback): number => {
    const id = this._idGen();
    this._queue.set(id, callback);
    this.signalWork();
    return id;
  };

  cancel = (id: number) => {
    this._queue.delete(id);
  };
}
