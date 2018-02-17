// @flow

import * as React from 'react';
import { View, Button, StyleSheet, Text, TextInput } from 'react-native-web';

type Props = {|
  streamRunning: boolean,
  onStreamToggle: () => void,
  onPrepend: number => void,
  prependCount: number,
  itemCount: number
|};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  numericField: {
    flexDirection: 'row'
  }
});

const ControlPanel = ({
  onStreamToggle,
  streamRunning,
  onPrepend,
  itemCount
}: Props) => (
  <View style={styles.root}>
    <ControlButton
      title={streamRunning ? 'Stop prepend stream' : 'Start prepend stream'}
      onPress={onStreamToggle}
    />
    <Text>{`${itemCount} items`}</Text>
    <NumericField initialValue={20} onSubmit={onPrepend} />
  </View>
);

ControlPanel.displayType = 'ControlPanel';

type ControlButtonProps = { title: string, onPress: () => void };

const ControlButton = ({ title, onPress }: ControlButtonProps) => (
  <View style={styles.button}>
    <Button title={title} onPress={onPress} />
  </View>
);

type NumericFieldProps = {
  initialValue: number,
  onSubmit: number => void
};

class NumericField extends React.Component<
  NumericFieldProps,
  { value: number }
> {
  static defaultProps = { initialValue: 1 };

  constructor(props) {
    super(props);
    this.state = { value: props.initialValue };
  }

  render() {
    return (
      <View style={styles.numericField}>
        <TextInput
          defaultValue={String(this.props.initialValue)}
          onChangeText={this._handleChange}
        />
        <Button title="Prepend" onPress={this._handlePress} />
      </View>
    );
  }

  _handleChange = text => {
    const value = parseInt(text, 10);
    if (value > 0) {
      this.setState({ value });
    }
  };

  _handlePress = () => {
    const { onSubmit } = this.props;
    onSubmit(this.state.value);
  };
}

export default ControlPanel;
