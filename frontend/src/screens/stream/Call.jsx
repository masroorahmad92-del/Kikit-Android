import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  StreamCall,
  RingingCallContent,
  CallContent,
  useCalls,
} from '@stream-io/video-react-native-sdk';
import {View, Text, StyleSheet} from 'react-native';
import Toast from 'react-native-toast-message';
import CustomCallControls from './CustomCallControls';
import GiftBottomSheet from '../../components/GiftBottomSheet';
import {useKitkitStore} from '../../store/kitkitStore';
import {userService} from '../../api/services/userService';
// import ringtoneManager from '../../utils/ringtoneManager';

const Call = ({navigation, route}) => {
  const {user, setUserProfile} = useKitkitStore();
  const giftSheetRef = useRef();
  const timerRef = useRef(null);
  const timerStartedRef = useRef(false);
  const callRecordedRef = useRef(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const calls = useCalls();
  const call = calls[0];
console.log('call?.state?.members', call?.state?.members);
console.log('logged in user', user);
  // Get the other participant (recipient) ID from the call
  const recipientId = useMemo(() => {
    if (!call) {
      return null;
    }
    const currentUserId = user?.user?.id;
    const members = call.state.members || [];
    
    // First, try to find other member from members array
    const otherMember = members.find(
      member => member.user_id !== currentUserId,
    );
    
    if (otherMember) {
      console.log('otherMember from members--->', otherMember);
      return otherMember.user_id;
    }
    
    // If not found in members, check if current user is the callee
    // In that case, the caller info is in call.state.createdBy
    const createdBy = call.state.createdBy;
    if (createdBy && createdBy.id !== currentUserId) {
      console.log('otherMember from createdBy--->', createdBy);
      return createdBy.id;
    }
    
    console.log('otherMember not found');
    return null;
  }, [call, user?.user?.id]);

  const handleGiftPress = useCallback(() => {
    console.log('handleGiftPress - recipientId:', recipientId);
    if (!recipientId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Recipient information is missing',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }
    giftSheetRef.current?.open();
  }, [recipientId]);

  const CallControlsComponent = useCallback(() => {
    return <CustomCallControls onGiftPress={handleGiftPress} />;
  }, [handleGiftPress]);

  useEffect(() => {
    if (!call) {
      navigation.goBack();
      return;
    }

    // Initialize ringtone
    // ringtoneManager.init();

    // Listen for when participant leaves during active call
    const handleParticipantLeft = event => {
      console.log('Participant left:', event);
      const participants = call.state.participants;
      // If we're in an active call and other participant left, end the call
      if (call.state.callingState === 'joined' && participants.length <= 1) {
        console.log('Other participant left, ending call');
        // ringtoneManager.stop();
        call.leave();
        navigation.goBack();
      }
    };

    call.on('call.session_participant_left', handleParticipantLeft);

    return () => {
      call.off('call.session_participant_left', handleParticipantLeft);
      // ringtoneManager.stop();
    };
  }, [call, navigation]);

  // Handle ringtone based on call state
  useEffect(() => {
    if (!call) {
      return;
    }

    const callingState = call.state.callingState;

    // Play ringtone when call is ringing
    // if (callingState === 'ringing') {
    //   console.log('Call is ringing, playing ringtone');
    //   ringtoneManager.play();
    // } else {
    //   // Stop ringtone when call is accepted, rejected, or ended
    //   console.log(
    //     'Call state changed to:',
    //     callingState,
    //     '- stopping ringtone',
    //   );
    //   ringtoneManager.stop();
    // }

    // return () => {
    //   ringtoneManager.stop();
    // };
  }, [call, call?.state.callingState]);

  // Timer for non-annual calls (10 * 60 for production)
  const isTimedCall = route?.params?.isTimedCall === true;

  // Record call on backend when call connects
  // Backend handles priority: drains purchased_calls first, then increments calls_taken
  const recordCallOnBackend = useCallback(async () => {
    if (!isTimedCall || callRecordedRef.current) {
      return;
    }
    callRecordedRef.current = true;
    try {
      await userService.recordCall();
      console.log('Call recorded on backend');
      // Refetch profile to update calls_taken and purchased_calls in store
      const profileResp = await userService.getMyProfile();
      const profileData = profileResp?.data?.data;
      if (profileData) {
        setUserProfile(profileData);
        console.log('Profile updated after call record');
      }
    } catch (err) {
      console.log('Failed to record call on backend:', err);
    }
  }, [isTimedCall, setUserProfile]);

  useEffect(() => {
    if (!call || !isTimedCall) {
      return;
    }

    const startCallTimer = () => {
      if (timerStartedRef.current) {
        return;
      }
      timerStartedRef.current = true;
      console.log('Starting timed call timer (monthly or extra)');

      // Record call on backend when timer starts (call connected)
      recordCallOnBackend();

      const CALL_DURATION = 10 * 60;
      setTimeRemaining(CALL_DURATION);
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            call.leave().catch(e => console.error('Error auto-ending call:', e));
            navigation.goBack();
            Toast.show({
              type: 'info',
              text1: 'Call Ended',
              text2: 'Your call time limit has been reached.',
              position: 'top',
              visibilityTime: 4000,
            });
            return 0;
          }
          if (prev === 61) {
            Toast.show({
              type: 'info',
              text1: 'Time Warning',
              text2: '1 minute remaining in your call.',
              position: 'top',
              visibilityTime: 3000,
            });
          }
          return prev - 1;
        });
      }, 1000);
    };

    // If already joined, start timer immediately
    if (call.state.callingState === 'joined') {
      startCallTimer();
    }

    // Listen for participant joined event to detect when call connects
    const handleParticipantJoined = () => {
      if (call.state.callingState === 'joined') {
        startCallTimer();
      }
    };

    call.on('call.session_participant_joined', handleParticipantJoined);

    return () => {
      call.off('call.session_participant_joined', handleParticipantJoined);
    };
  }, [call, isTimedCall, navigation, recordCallOnBackend]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  if (!call) {
    return null;
  }

  const callingState = call.state.callingState;

  // Show RingingCallContent when:
  // 1. Call is in 'ringing' state (for both caller and callee)
  // 2. Call is in 'joining' state (while connecting)
  // Show CallContent when:
  // 1. Call is 'joined' (connected)
  const shouldShowRingingContent =
    callingState === 'ringing' || callingState === 'joining';

  const handleHangup = async () => {
    try {
      console.log('handleHangup - leaving call');
      // ringtoneManager.stop();
      // Leave the call - this will trigger session_participant_left for the other user
      await call.leave();
      navigation.goBack();
    } catch (error) {
      console.error('Error leaving call:', error);
      // ringtoneManager.stop();
      navigation.goBack();
    }
  };

  return (
    <View style={styles.callContainer}>
      <StreamCall call={call}>
        {shouldShowRingingContent ? (
          <RingingCallContent
            CallContent={props => (
              <CallContent
                {...props}
                onHangupCallHandler={handleHangup}
                CallControls={CallControlsComponent}
              />
            )}
          />
        ) : (
          <CallContent
            onHangupCallHandler={handleHangup}
            CallControls={CallControlsComponent} 
          />
        )}
      </StreamCall>
      {/* Timer overlay for monthly plan or extra call */}
      {timeRemaining !== null && (
        <View style={styles.timerOverlay}>
          <View
            style={[
              styles.timerBadge,
              timeRemaining <= 60 && styles.timerBadgeWarning,
            ]}>
            <Text style={styles.timerText}>
              {Math.floor(timeRemaining / 60)}:
              {String(timeRemaining % 60).padStart(2, '0')}
            </Text>
          </View>
        </View>
      )}
      {/* Gift Bottom Sheet - placed outside StreamCall to avoid z-index conflicts */}
      <GiftBottomSheet ref={giftSheetRef} recipientId={recipientId} />
    </View>
  );
};

const styles = StyleSheet.create({
  callContainer: {
    flex: 1,
  },
  timerOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  timerBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerBadgeWarning: {
    backgroundColor: 'rgba(255, 59, 48, 0.85)',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

export default Call;
