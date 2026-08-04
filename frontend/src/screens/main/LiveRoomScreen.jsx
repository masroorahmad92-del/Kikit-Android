import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CallContent,
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import {
  Channel,
  MessageInput,
  MessageList,
  useChatContext,
} from 'stream-chat-react-native';
import Toast from 'react-native-toast-message';

import ConfirmationModal from '../../components/ConfirmationModal';
import GiftBottomSheet from '../../components/GiftBottomSheet';
import {Text} from '../../components/base/Text';
import {ArrowBack, BlockIcon, GiftIcon, ReportIcon, VerificationIcon} from '../../assets/icons';
import {liveRoomsService} from '../../api/services/liveRoomsService';
import {matchesService} from '../../api/services/matchesService';
import {useKitkitStore} from '../../store/kitkitStore';
import {colors, moderateScale} from '../../theme';

const LiveRoomScreen = ({navigation, route}) => {
  const initialRoom = route?.params?.room;
  const [room] = useState(initialRoom);
  const [call, setCall] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isJoining, setIsJoining] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const giftSheetRef = useRef();
  const videoClient = useStreamVideoClient();
  const {client: chatClient} = useChatContext();
  const {user} = useKitkitStore();

  const isHost = useMemo(
    () => String(room?.host_user_id) === String(user?.user?.id),
    [room?.host_user_id, user?.user?.id],
  );

  useEffect(() => {
    let mounted = true;
    const connectRoom = async () => {
      if (!room || !videoClient || !chatClient) {
        setIsJoining(false);
        return;
      }
      try {
        setIsJoining(true);
        const roomCall = videoClient.call('livestream', room.stream_call_id);
        await roomCall.getOrCreate({
          data: {
            members: [{user_id: String(room.host_user_id)}],
            custom: {live_room_id: String(room.id), title: room.title},
          },
        });
        await roomCall.join({create: true});
        const roomChannel = chatClient.channel('livestream', room.stream_chat_channel_id, {
          name: room.title,
          live_room_id: String(room.id),
        });
        await roomChannel.watch();
        if (mounted) {
          setCall(roomCall);
          setChannel(roomChannel);
        }
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Room unavailable',
          text2: error?.message || 'Please try again.',
        });
      } finally {
        if (mounted) {
          setIsJoining(false);
        }
      }
    };
    connectRoom();
    return () => {
      mounted = false;
      call?.leave?.().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatClient, room?.id, videoClient]);

  const leaveRoom = useCallback(async () => {
    try {
      await call?.leave?.();
      if (room?.id) {
        await liveRoomsService.leaveRoom(room.id);
      }
    } catch (error) {
      console.log('Failed to leave live room:', error);
    } finally {
      navigation.goBack();
    }
  }, [call, navigation, room?.id]);

  const endRoom = async () => {
    try {
      setIsEnding(true);
      await liveRoomsService.endRoom(room.id);
      await call?.endCall?.();
      await call?.leave?.();
      Toast.show({type: 'success', text1: 'Live room ended'});
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not end room',
        text2: error?.message || 'Please try again.',
      });
    } finally {
      setIsEnding(false);
    }
  };

  const reportHost = async () => {
    try {
      await matchesService.reportProfile({
        reported_user_id: room.host_user_id,
        reason: 'INAPPROPRIATE_CONTENT',
        description: `Reported from live room: ${room.title}`,
        live_room_id: room.id,
      });
      setShowReportModal(false);
      Toast.show({type: 'success', text1: 'Report submitted'});
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Report failed',
        text2: error?.message || 'Please try again.',
      });
    }
  };

  const blockHost = async () => {
    try {
      await matchesService.blockUser(room.host_user_id);
      setShowBlockModal(false);
      Toast.show({type: 'success', text1: 'User blocked'});
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Block failed',
        text2: error?.message || 'Please try again.',
      });
    }
  };

  if (isJoining || !call || !channel) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.secondary} size="large" />
        <Text ff="c-Regular" fs="S" color="grey400" style={styles.loadingText}>
          Opening live room...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.roundButton} onPress={leaveRoom}>
          <ArrowBack width={22} height={22} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <View style={styles.liveRow}>
            <View style={styles.liveBadge}>
              <Text ff="c-Bold" fs="XXS" color="white">LIVE</Text>
            </View>
            <Text ff="c-Regular" fs="XS" color="grey400">
              {room.viewer_count || 0} viewers
            </Text>
          </View>
          <Text ff="c-Bold" fs="L" color="grey800" numberOfLines={1}>
            {room.title}
          </Text>
          <View style={styles.hostRow}>
            <Text ff="c-Regular" fs="XS" color="grey400" numberOfLines={1}>
              {room.category_name || 'Community'} with {room.host_name}
            </Text>
            {room.host_verified && <VerificationIcon width={14} height={14} />}
          </View>
        </View>
        {!isHost && (
          <View style={styles.safetyActions}>
            <TouchableOpacity style={styles.roundButton} onPress={() => setShowReportModal(true)}>
              <ReportIcon width={20} height={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.roundButton} onPress={() => setShowBlockModal(true)}>
              <BlockIcon width={20} height={20} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.videoWrap}>
        <StreamCall call={call}>
          <CallContent />
        </StreamCall>
      </View>

      <View style={styles.chatPanel}>
        <View style={styles.chatHeader}>
          <Text ff="c-Bold" fs="M" color="grey800">Room conversation</Text>
          <TouchableOpacity
            style={styles.giftButton}
            onPress={() => giftSheetRef.current?.open()}
            disabled={isHost}>
            <GiftIcon width={20} height={20} />
            <Text ff="c-Bold" fs="S" color={isHost ? 'grey400' : 'white'}>
              Gift
            </Text>
          </TouchableOpacity>
        </View>
        <Channel channel={channel}>
          <MessageList />
          <MessageInput />
        </Channel>
      </View>

      {isHost && (
        <TouchableOpacity
          style={styles.endButton}
          onPress={endRoom}
          disabled={isEnding}>
          {isEnding ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text ff="c-Bold" fs="M" color="white">End Room</Text>
          )}
        </TouchableOpacity>
      )}

      <GiftBottomSheet
        ref={giftSheetRef}
        recipientId={room.host_user_id}
        liveRoomId={room.id}
      />

      <ConfirmationModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        icon={<ReportIcon width={54} height={54} />}
        title="Report Room"
        message="Report this live room for review. Kikit has zero tolerance for abusive or objectionable content."
        confirmText="Report"
        cancelText="Cancel"
        onConfirm={reportHost}
        onCancel={() => setShowReportModal(false)}
      />

      <ConfirmationModal
        visible={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        icon={<BlockIcon width={54} height={54} />}
        title="Block Host"
        message="You will stop seeing this host in live rooms, chat, gifts, and other community spaces."
        confirmText="Block"
        cancelText="Cancel"
        onConfirm={blockHost}
        onCancel={() => setShowBlockModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.white},
  loadingScreen: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white},
  loadingText: {marginTop: moderateScale(10)},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  roundButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: colors.grey50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {flex: 1},
  liveRow: {flexDirection: 'row', alignItems: 'center', gap: moderateScale(8), marginBottom: moderateScale(2)},
  liveBadge: {
    backgroundColor: colors.danger,
    paddingHorizontal: moderateScale(8),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostRow: {flexDirection: 'row', alignItems: 'center', gap: moderateScale(4), marginTop: moderateScale(2)},
  safetyActions: {flexDirection: 'row', gap: moderateScale(6)},
  videoWrap: {height: '46%', backgroundColor: '#111827'},
  chatPanel: {flex: 1, backgroundColor: colors.white},
  chatHeader: {
    height: moderateScale(52),
    paddingHorizontal: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  giftButton: {
    minWidth: moderateScale(86),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(6),
  },
  endButton: {
    height: moderateScale(48),
    marginHorizontal: moderateScale(16),
    marginBottom: moderateScale(12),
    borderRadius: moderateScale(24),
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LiveRoomScreen;
