import {Button, StyleSheet, Text, View} from 'react-native';
import React from 'react';
export const STREAM_API_KEY = 'YOUR_STREAM_API_KEY';
export const STREAM_API_SECRET = 'YOUR_STREAM_API_SECRET_SERVER_ONLY';
export const users = [
  {
    email: 'saad@yopmail.com',
    id: 1,
  },
  {
    email: 'arsal@yopmail.com',
    id: 2,
  },
];
const Home = ({navigation}) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text>Home</Text>
      <Button
        title="Open Chat"
        onPress={() => {
          navigation.navigate('create-chat');
          // navigation.navigate('video-call');
        }}
      />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({});
