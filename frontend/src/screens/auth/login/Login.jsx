import {StyleSheet, View} from 'react-native';
import React from 'react';
import ProfileVerificationCamera from '../../../components/ProfileVerificationCamera';
import {colors} from '../../../theme';

const Login = () => {
  const handleImageCaptured = async photo => {
    console.log('Image captured:', photo);
    // Handle the captured image
  };
  return (
    <View style={{flex: 1, backgroundColor: colors.white}}>
      <ProfileVerificationCamera onImageCaptured={handleImageCaptured} />
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({});
