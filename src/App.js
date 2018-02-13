// @flow

import * as React from 'react';
import TestBench from './TestBench';

class App extends React.Component<{}> {
  render() {
    return <TestBench initialCount={10} />;
  }
}

export default App;
