// @flow

import * as React from 'react';
import { View, StyleSheet, Text } from 'react-native-web';

type Props = {
  color: string,
  text: string
};

const styles = StyleSheet.create({
  root: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center'
  },

  text: {
    color: 'white',
    fontSize: '2rem',
    fontFamily: 'sans-serif'
  }
});

export default class Item extends React.Component<Props> {
  render() {
    return (
      <View style={[styles.root, { backgroundColor: this.props.color }]}>
        <Text style={styles.text}>{this.props.text}</Text>
      </View>
    );
  }
}
