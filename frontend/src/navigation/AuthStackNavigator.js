import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from '../screens/auth/login/Login';
import EmailInput from '../screens/auth/login/EmailInput';
import Signup from '../screens/auth/login/Signup';
import OTPVerification from '../screens/auth/login/OTPVerification';
import Onboard1 from '../screens/auth/onboarding/Onboard1';
import Onboard2 from '../screens/auth/onboarding/Onboard2';
import Onboard3 from '../screens/auth/onboarding/Onboard3';
import Onboard4 from '../screens/auth/onboarding/Onboard4';
import Onboard5 from '../screens/auth/onboarding/Onboard5';
import LocationPermissionScreen from '../screens/auth/onboarding/LocationPermissionScreen';
import VerifyYourProfileScreen from '../screens/auth/onboarding/VerifyYourProfileScreen';

const Stack = createNativeStackNavigator();
const AuthStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={'onboard1'}>
      <Stack.Screen name={'login'} component={Login} />
      <Stack.Screen name={'email-input'} component={EmailInput} />
      <Stack.Screen name={'signup'} component={Signup} />
      <Stack.Screen name={'otp-verification'} component={OTPVerification} />
      <Stack.Screen name={'onboard1'} component={Onboard1} />
      <Stack.Screen name={'onboard2'} component={Onboard2} />
      <Stack.Screen name={'onboard3'} component={Onboard3} />
      <Stack.Screen name={'onboard4'} component={Onboard4} />
      <Stack.Screen name={'onboard5'} component={Onboard5} />
      <Stack.Screen
        name={'location-screen'}
        component={LocationPermissionScreen}
      />
      <Stack.Screen
        name={'verify-profile-screen'}
        component={VerifyYourProfileScreen}
      />
    </Stack.Navigator>
  );
};
export default AuthStackNavigator;
