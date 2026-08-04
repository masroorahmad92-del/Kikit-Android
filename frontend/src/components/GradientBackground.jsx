// GradientBackground.js
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {StyleSheet} from 'react-native';

const GradientBackground = ({children, style}) => {
  return (
    <LinearGradient
      colors={['#01A0FE', '#01A0FE','#B7E5FF','#B7E5FF']}
      start={{x: 0.5, y: 0}}
      end={{x: 0.5, y: 1}}
      style={[styles.container, style]}>
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GradientBackground;
