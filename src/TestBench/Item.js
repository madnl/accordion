// @flow

import * as React from 'react';
import { View, StyleSheet, Text, Button } from 'react-native-web';

type Props = {
  id: number,
  onInsertAbove: number => void,
  onInsertBelow: number => void
};

const styles = StyleSheet.create({
  root: {
    height: 200,
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row'
  },

  text: {
    color: 'white',
    fontSize: '2rem',
    fontFamily: 'sans-serif'
  },

  buttonRow: {
    flexDirection: 'column'
  }
});

export default class Item extends React.Component<Props> {
  render() {
    const { id } = this.props;
    const color = colorPalette[id % colorPalette.length];
    return (
      <View style={[styles.root, { backgroundColor: color }]}>
        <Text style={styles.text}>{id}</Text>
        <View style={styles.buttonRow}>
          <Button onPress={this._handleInsertAbove} title="Add ↑" />
          <Button onPress={this._handleInsertBelow} title="Add ↓" />
        </View>
      </View>
    );
  }

  _handleInsertAbove = () => {
    const { onInsertAbove, id } = this.props;
    onInsertAbove(id);
  };

  _handleInsertBelow = () => {
    const { onInsertBelow, id } = this.props;
    onInsertBelow(id);
  };
}

const colorPalette = [
  'rgb(216, 17, 89)',
  'rgb(143, 45, 86)',
  'rgb(33, 131, 128)',
  'rgb(251, 177, 60)',
  'rgb(115, 210, 222)'
];
