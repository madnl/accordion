// @flow

import * as React from 'react';
import { View, StyleSheet } from 'react-native-web';

type Props = {
  header: React.Node,
  children: React.Node
};

type State = {
  headerHeight: number
};

const styles = StyleSheet.create({
  header: {
    position: 'fixed',
    top: 0,
    width: '100%',
    zIndex: 1,
    backgroundColor: '#FFF',
    boxShadow: '0 0 4px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)'
  }
});

export default class AppLayout extends React.Component<Props, State> {
  state = { headerHeight: 0 };

  render() {
    const { header, children } = this.props;
    return (
      <View style={{ marginTop: this.state.headerHeight }}>
        <View style={styles.header} onLayout={this._handleLayout}>
          {header}
        </View>
        <View>{children}</View>
      </View>
    );
  }

  _handleLayout = ({ nativeEvent: { layout: { height } } }: any) => {
    this.setState({ headerHeight: height });
  };
}
