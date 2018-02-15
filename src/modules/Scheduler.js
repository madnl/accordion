// @flow

type RequestId = number;

export default function Scheduler<Arg>(
  requester: (() => void) => RequestId,
  callback: Arg => void,
  combineArgs: (prev: Arg, next: Arg) => Arg
): Arg => void {
  let nextRequest: ?{ id: RequestId, arg: Arg } = undefined;

  const onCallback = () => {
    if (nextRequest) {
      const { arg } = nextRequest;
      nextRequest = undefined;
      callback(arg);
    }
  };

  return (arg: Arg) => {
    if (nextRequest) {
      nextRequest.arg = combineArgs(nextRequest.arg, arg);
    } else {
      const id = requester(onCallback);
      nextRequest = { arg, id };
    }
  };
}
