// @flow

type Generator = () => number;

export default (): Generator => {
  let counter = 1;
  return () => {
    if (counter === Number.MAX_SAFE_INTEGER) {
      counter = 1;
    }
    const result = counter;
    counter++;
    return result;
  };
};
