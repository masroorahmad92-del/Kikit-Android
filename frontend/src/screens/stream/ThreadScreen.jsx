import {SafeAreaView, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {useAtom} from 'jotai';
import {selectedChannelAtom, selectedThreadAtom} from '../../utils/atoms';
import {Channel, Thread} from 'stream-chat-react-native';

const ThreadScreen = () => {
  const [selectedChannel, setSelectedChannel] = useAtom(selectedChannelAtom);
  const [selectedThread, setSelectedThread] = useAtom(selectedThreadAtom);
  return (
    <SafeAreaView style={{flex: 1}}>
      <Text>Thread</Text>
      <Channel
        channel={selectedChannel}
        thread={selectedThread}
        threadList={true}>
        <Thread />
      </Channel>
    </SafeAreaView>
  );
};

export default ThreadScreen;

const styles = StyleSheet.create({});
