import {useNavigation} from '@react-navigation/native';
import {useCalls} from '@stream-io/video-react-native-sdk';
import {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {useKitkitStore} from '../../store/kitkitStore';

export default function CallProvider({children}) {
  const {user} = useKitkitStore();

  const navigation = useNavigation();
  const calls = useCalls();
  const call = calls[0]; //one active call at a time
  const [currentScreen, setCurrentScreen] = useState(null);
  const isOnCallScreen = useMemo(
    () => currentScreen === 'call',
    [currentScreen],
  );
  // Get current screen from navigation state
  useEffect(() => {
    if (!navigation) {
      return;
    }

    // Get current route
    const getCurrentRoute = () => {
      const state = navigation.getState();
      if (state) {
        const route = state.routes[state.index];
        return route?.name || null;
      }
      return null;
    };

    // Set initial screen
    setCurrentScreen(getCurrentRoute());

    // Listen to navigation state changes
    const unsubscribe = navigation.addListener('state', () => {
      const screenName = getCurrentRoute();
      setCurrentScreen(screenName);
      //  console.log('Current screen:', screenName);
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!call) {
      return;
    }
    if (!isOnCallScreen && call.state.callingState === 'ringing') {
      navigation.navigate('call');
    }

    // Event handlers for call state changes
    const handleCallRejected = () => {
      console.log('call rejected', user);
      if (isOnCallScreen) {
        navigation.goBack();
      }
    };

    const handleCallEnded = () => {
      console.log('call ended', user);
      if (isOnCallScreen) {
        navigation.goBack();
      }
    };

    const handleCallCanceled = () => {
      console.log('call cancelled', user);
      if (isOnCallScreen) {
        navigation.goBack();
      }
    };

    // Subscribe to call events
    call.on('call.rejected', handleCallRejected);
    call.on('call.ended', handleCallEnded);
    call.on('call.canceled', handleCallCanceled);

    // Cleanup: Remove event listeners when component unmounts or call changes
    return () => {
      call.off('call.rejected', handleCallRejected);
      call.off('call.ended', handleCallEnded);
      call.off('call.canceled', handleCallCanceled);
    };
  }, [call, isOnCallScreen, navigation, user]);

  return (
    <>
      {children}
      {call && !isOnCallScreen && (
        <Pressable
          onPress={() => {
            navigation.navigate('call');
          }}
          style={styles.container}>
          <Text>Active Call :{call?.id}</Text>
        </Pressable>
      )}
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'lightgreen',
    top: 50,
    left: 0,
    right: 0,
    padding: 10,
  },
});
