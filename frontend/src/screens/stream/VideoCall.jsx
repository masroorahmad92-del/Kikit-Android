import {PermissionsAndroid, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {
  CallContent,
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);

const VideoCall = ({navigation, route}) => {
  const [call, setCall] = useState(null);
  const client = useStreamVideoClient();
  useEffect(() => {
    navigation.setOptions({
      title: 'Video Call',
      headerBackTitle: 'Back',
    });
  }, [navigation]);

  useEffect(() => {
    if (!client) {
      return;
    }
    // default means the default video call settings and 2nd param is for the id
    const _call = client.call('default', 'f2f0fd3f-e08f-4c4b-83d3-199812082664');//stream chat id for alia
    // const _call = client.call('default', 'default_a1202187-2fbf-4bc3-89df-72fdcca49650');//stream chat id for alia
    _call.join({create: true});
    if (_call) {
      setCall(_call);
      _call.on('call.rejected', () => {
        _call.leave();
        // navigation.goBack();
      });
      _call.on('call.canceled', () => {
        _call.leave();
        // navigation.goBack();
      });
      // here we can add condition like if isTheraptist is true than we can start the recording and transciption
      //  _call.startRecording();
      //  _call.startTranscription();
    }
   

  }, [client]);

  useEffect(() => {
    //     return () => {
    //       if (call?.state.callingState !== CallingState.LEFT) {
    //         call?.leave();
    //       }
    //     };
  }, [call]);

  if (!call) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text>Session has not started yet...</Text>
      </SafeAreaView>
    );
  }

  return (
    <StreamCall call={call}>
      <View style={styles.flexFill}>
        <CallContent
        layout="grid"
        onHangupCallHandler={()=>{
        // call?.stopRecording();
        // call?.stopTranscription();
          call?.leave();
          navigation.goBack();
        
        }}
         />
      </View>
    </StreamCall>
  );
};

export default VideoCall;

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flexFill: {
    flex: 1,
  },
});
