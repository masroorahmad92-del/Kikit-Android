import React from 'react';
import {StyleSheet, View, Modal, ActivityIndicator} from 'react-native';
import {colors} from '../../theme';

export const Loader = props => {
  const {loading} = props;
  return loading ? (
    <Modal
      // backdropTransitionOutTiming={0}
      hideModalContentWhileAnimating
      transparent={true}
      animationType={'fade'}
      visible={loading}>
      <View
        style={[styles.modalBackground, {backgroundColor: 'rgba(0,0,0, .2)'}]}>
        <ActivityIndicator
          size={'large'}
          animating={loading}
          color={colors.primary}
        />
      </View>
    </Modal>
  ) : null;
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: colors.white,
    justifyContent: 'space-around',
  },
  activityIndicatorWrapper: {
    flex: 0.5,
    backgroundColor: colors.transparent,
    height: '20%',
    width: '60%',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  imgGIF: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
    alignSelf: 'center',
  },
});
