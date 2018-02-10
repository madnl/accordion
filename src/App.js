// @flow

import * as React from 'react';
import TestBench from './TestBench';

class App extends React.Component<{}> {
  render() {
    return <TestBench initialCount={100} />;
  }
}

export default App;
