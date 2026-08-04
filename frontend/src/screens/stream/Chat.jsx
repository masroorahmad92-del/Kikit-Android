import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform,
  KeyboardAvoidingView,
  Animated,
  DeviceEventEmitter,
} from 'react-native';
import React, {useMemo, useRef, useEffect, useState} from 'react';
import {
  Channel,
  MessageInput,
  MessageList,
  messageActions as streamMessageActions,
  useChatContext,
  useMessageContext,
} from 'stream-chat-react-native';
import {CheckDouble} from '../../assets/icons';
import {useAtom} from 'jotai';
import {selectedChannelAtom, selectedThreadAtom} from '../../utils/atoms';
import {
  PhoneIcon,
  ArrowBack,
  GiftIcon,
  StarIcon,
  ReportIcon,
  BlockIcon,
} from '../../assets/icons';
import {useStreamVideoClient} from '@stream-io/video-react-native-sdk';
import {colors, moderateScale} from '../../theme';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import GiftBottomSheet from '../../components/GiftBottomSheet';
import ConfirmationModal from '../../components/ConfirmationModal';
import MessageActionSheet from '../../components/MessageActionSheet';
import {useKitkitStore} from '../../store/kitkitStore';
import {matchesService} from '../../api/services/matchesService';

// Custom MessageStatus: skips deliveredToCount (requires Stream delivery receipts feature).
// Uses only readBy — single tick (sent) → double blue (read).
const CustomMessageStatus = () => {
  const {message, readBy, threadList} = useMessageContext();

  if (threadList || message.status === 'failed' || message.type === 'error') {
    return null;
  }

  const sending = message.status === 'sending';
  const read = readBy === true || (typeof readBy === 'number' && readBy > 1);

  if (sending) {
    return <Text style={customStatusStyles.singleTick}>✓</Text>;
  }
  if (read) {
    return <CheckDouble width={16} height={16} stroke="#007AFF" />;
  }
  // sent but not yet read — double grey
  return <CheckDouble width={16} height={16} stroke="#8E8E93" />;
};

const customStatusStyles = StyleSheet.create({
  singleTick: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
    paddingRight: 3,
  },
});

const Chat = ({navigation, route}) => {
  const {user, isPremium, activePlan, userProfile} = useKitkitStore();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showCallLimitModal, setShowCallLimitModal] = useState(false);
  const [actionSheetMessage, setActionSheetMessage] = useState(null);
  const [pendingBlockUser, setPendingBlockUser] = useState(null);
  const [isBlockingUser, setIsBlockingUser] = useState(false);
  console.log('user in chat.jsx', user);
  console.log(' route.params',  route.params);
  const {channel} = route.params;
  const {client} = useChatContext();
  const videoClient = useStreamVideoClient();
  const _channel = client?.channel('messaging', channel?.data?.id);
  const [, setSelectedChannel] = useAtom(selectedChannelAtom);
  const [, setSelectedThread] = useAtom(selectedThreadAtom);

  // Gift bottom sheet ref
  const giftSheetRef = useRef();

  // Gift button pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Get other user info from channel
  const otherUser = useMemo(() => {
    if (!channel?.state?.members) {
      return null;
    }
    const members = Object.values(channel.state.members);
    const otherMember = members.find(
      member => member.user_id !== client?.userID,
    );
    // console.log('otherMember in chat.jsx', otherMember);
    return otherMember?.user || null;
  }, [channel, client]);

  const handleThreadSelect = thread => {
    console.log('thread', thread);
    setSelectedThread(thread);
    setSelectedChannel(channel);
    navigation.navigate('thread-screen');
  };

  if (!_channel) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Channel not found</Text>
      </SafeAreaView>
    );
  }

  // console.log('other in user id', otherUser?.id);
  // console.log('logged in user id', client?.userID);
  const handleProfilePress = () => {
    if (otherUser?.id) {
      const item = {
        id: otherUser.id,
        name: otherUser.name,
        image: otherUser.image ? {uri: otherUser.image} : null,
      };
      navigation.navigate('ProfileDetail', {item,fromChatPage:true});
    }
  };

  const handleGiftPress = () => {
    if (!otherUser?.id) {
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
  };

  const handleRequestBlockUser = sender => {
    setActionSheetMessage(null);
    setPendingBlockUser(sender);
  };

  const buildMessageActions = params => {
    const defaultActions = streamMessageActions(params).filter(
      action => action.actionType !== 'flagMessage',
    );
    const {dismissOverlay, isMyMessage, message} = params;

    if (isMyMessage || !message?.user?.id) {
      return defaultActions;
    }

    const dangerColor = colors.danger || '#FF2B1F';

    return [
      ...defaultActions,
      {
        action: () => {
          dismissOverlay();
          setActionSheetMessage(message);
        },
        actionType: 'reportMessage',
        icon: <ReportIcon width={20} height={20} />,
        title: 'Report Message',
        titleStyle: {color: dangerColor},
      },
      {
        action: () => {
          dismissOverlay();
          handleRequestBlockUser(message.user);
        },
        actionType: 'blockSender',
        icon: <BlockIcon width={20} height={20} color={dangerColor} />,
        title: 'Block Sender',
        titleStyle: {color: dangerColor},
      },
    ];
  };

  const handleConfirmBlockUser = async () => {
    if (!pendingBlockUser?.id) {
      return;
    }

    try {
      setIsBlockingUser(true);
      await matchesService.blockUser(pendingBlockUser.id);
      DeviceEventEmitter.emit('userBlocked', {
        userId: pendingBlockUser.id,
      });
      Toast.show({
        type: 'success',
        text1: 'User Blocked',
        text2: `${pendingBlockUser?.name || 'User'} has been blocked.`,
        position: 'top',
        visibilityTime: 3000,
      });
      setPendingBlockUser(null);
      navigation.goBack();
    } catch (err) {
      console.error('Error blocking user from chat:', err);
      Toast.show({
        type: 'error',
        text1: 'Block Failed',
        text2:
          err?.response?.data?.message ||
          'Failed to block user. Please try again.',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setIsBlockingUser(false);
    }
  };

  const joinCall = async () => {
    const purchasedCalls = userProfile?.purchased_calls || 0;
    const hasPurchasedCall = purchasedCalls > 0;
    console.log('joinCall - isPremium:', isPremium, 'purchasedCalls:', purchasedCalls);

    // Free user with no purchased calls → must subscribe or buy a call
    if (!isPremium && !hasPurchasedCall) {
      setShowSubscriptionModal(true);
      return;
    }

    // Monthly user: check if subscription call is used AND no purchased calls
    if (isPremium && activePlan === 'monthly') {
      const callsTaken = userProfile?.calls_taken || 0;
      if (callsTaken >= 1 && !hasPurchasedCall) {
        setShowCallLimitModal(true);
        return;
      }
    }

    // Determine if this is a timed call (10 min limit)
    // Annual users = unlimited, no timer. Everyone else = timed.
    const isTimedCall = !(isPremium && activePlan === 'annual');

    const members = Object.values(channel.state.members).map(member => ({
      user_id: member.user_id,
    }));

    // Create a deterministic call ID under 64 characters
    // Include caller ID first to ensure correct caller/callee roles
    // Format: {callerIdShort}-{receiverIdShort}-call
    const callerId = client?.userID || '';
    const receiverId = otherUser?.id || '';

    // Take first 10 chars of each UUID (without dashes) to stay under 64 chars
    const callerShort = callerId.replace(/-/g, '').substring(0, 10);
    const receiverShort = receiverId.replace(/-/g, '').substring(0, 10);
    const callId = `${callerShort}-${receiverShort}-call`;

    const call = videoClient.call('default', callId);

    // Always create/get the call - the ID includes who is calling
    await call.getOrCreate({
      ring: true,
      data: {members},
    });

    // Record call on backend for monthly plan users
    navigation.navigate('call', {isTimedCall});
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.headerGradient}>
        <View style={styles.headerContainer}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <ArrowBack fill={colors.white} width={24} height={24} />
          </TouchableOpacity>

          {/* User Info */}
          <TouchableOpacity
            style={styles.userInfoContainer}
            onPress={handleProfilePress}
            activeOpacity={0.7}>
            {otherUser?.image ? (
              <Image source={{uri: otherUser.image}} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.userTextContainer}>
              <Text style={styles.userName} numberOfLines={1}>
                {otherUser?.name || 'User'}
              </Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: otherUser?.online
                        ? '#4CAF50'
                        : colors.grey400,
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {otherUser?.online ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={joinCall}
              activeOpacity={0.7}>
              <PhoneIcon width={22} height={22} stroke={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Chat Body */}
      <Channel
        channel={_channel}
        keyboardVerticalOffset={0}
        audioRecordingEnabled={true}
        asyncMessagesMultiSendEnabled={true}
        messageActions={buildMessageActions}
        MessageStatus={CustomMessageStatus}>
        <KeyboardAvoidingView
          style={styles.chatBody}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <MessageList
            onThreadSelect={handleThreadSelect}
            additionalFlatListProps={{
              style: styles.messageList,
              contentContainerStyle: styles.messageListContent,
            }}
            // Enhanced message theme
            myMessageTheme={{
              messageSimple: {
                content: {
                  containerInner: styles.myMessageContainer,
                  markdown: {
                    text: styles.myMessageText,
                  },
                },
              },
            }}
            // Enhanced other user message theme
            messageTheme={{
              messageSimple: {
                content: {
                  containerInner: styles.otherMessageContainer,
                  markdown: {
                    text: styles.otherMessageText,
                  },
                },
              },
            }}
          />
          <View style={styles.messageInputContainer}>
            <View style={styles.inputRow}>
              <Animated.View
                style={[
                  styles.giftButtonContainer,
                  {transform: [{scale: pulseAnim}]},
                ]}>
                <TouchableOpacity
                  style={styles.giftButton}
                  onPress={handleGiftPress}
                  activeOpacity={0.7}>
                  <GiftIcon width={24} height={24} />
                </TouchableOpacity>
              </Animated.View>
              <View style={styles.messageInputWrapper}>
                <MessageInput
                  additionalTextInputProps={{
                    placeholderTextColor: colors.grey400,
                  }}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Channel>

      {/* Gift Bottom Sheet */}
      <GiftBottomSheet ref={giftSheetRef} recipientId={otherUser?.id} />

      {/* Message Long-Press Action Sheet */}
      <MessageActionSheet
        visible={!!actionSheetMessage}
        message={actionSheetMessage}
        currentUserId={client?.userID}
        channelId={
          _channel?.id ||
          channel?.id ||
          channel?.data?.id ||
          channel?.cid?.split(':')?.[1] ||
          channel?.cid
        }
        initialStep="report_form"
        onBlockUser={handleRequestBlockUser}
        onClose={() => setActionSheetMessage(null)}
      />

      <ConfirmationModal
        visible={!!pendingBlockUser}
        onClose={() => setPendingBlockUser(null)}
        title="Block Sender"
        message={`Block ${pendingBlockUser?.name || 'this user'}? You will not see each other in live rooms, chat, or gifts.`}
        confirmText="Block"
        cancelText="Cancel"
        loading={isBlockingUser}
        onConfirm={handleConfirmBlockUser}
        onCancel={() => setPendingBlockUser(null)}
      />

      {/* Subscription Required Modal */}
      <ConfirmationModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        icon={<StarIcon width={60} height={60} fill={colors.primary} />}
        title="Subscription Required"
        message="Calling is a premium feature. Subscribe to a plan or purchase an extra call to start conversations with community members."
        confirmText="Subscribe Now"
        cancelText="Not Now"
        onConfirm={() => {
          setShowSubscriptionModal(false);
          navigation.navigate('Subscription');
        }}
        onCancel={() => setShowSubscriptionModal(false)}
      />

      {/* Monthly Call Limit Reached Modal */}
      <ConfirmationModal
        visible={showCallLimitModal}
        onClose={() => setShowCallLimitModal(false)}
        icon={<PhoneIcon width={60} height={60} stroke={colors.primary} />}
        title="Monthly Call Limit Reached"
        message="You've used your 1 call for this month. Upgrade to the Annual plan for unlimited calls, or purchase an extra call."
        confirmText="Upgrade Plan"
        cancelText="OK"
        onConfirm={() => {
          setShowCallLimitModal(false);
          navigation.navigate('Subscription');
        }}
        onCancel={() => setShowCallLimitModal(false)}
      />
    </SafeAreaView>
  );
};

export default Chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerGradient: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(14),
    gap: moderateScale(12),
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  userInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  avatar: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    borderWidth: 2.5,
    borderColor: colors.white,
    backgroundColor: colors.grey200,
  },
  avatarPlaceholder: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: colors.primary,
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: colors.white,
    marginBottom: moderateScale(3),
    letterSpacing: 0.2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  statusDot: {
    width: moderateScale(9),
    height: moderateScale(9),
    borderRadius: moderateScale(4.5),
    borderWidth: 2,
    borderColor: colors.white,
  },
  statusText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: colors.white,
    opacity: 0.95,
    letterSpacing: 0.1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  actionButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  callButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  chatBody: {
    flex: 1,
    backgroundColor: colors.grey50 || '#F5F7FA',
  },
  messageList: {
    flex: 1,
    backgroundColor: colors.grey50 || '#F5F7FA',
  },
  messageListContent: {
    paddingHorizontal: moderateScale(12),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(8),
  },
  // Enhanced message bubble styles for your messages
  myMessageContainer: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(18),
    borderBottomRightRadius: moderateScale(4),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  myMessageText: {
    fontSize: moderateScale(15),
    lineHeight: moderateScale(20),
    color: colors.white,
    fontWeight: '500',
  },
  // Enhanced message bubble styles for other user's messages
  otherMessageContainer: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(18),
    borderBottomLeftRadius: moderateScale(4),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    maxWidth: '75%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  otherMessageText: {
    fontSize: moderateScale(15),
    lineHeight: moderateScale(20),
    color: colors.grey900 || '#1A1A1A',
    fontWeight: '500',
  },
  messageInputContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF0',
    paddingBottom: moderateScale(60),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: moderateScale(12),
  },
  giftButtonContainer: {
    marginBottom: moderateScale(14),
    marginRight: moderateScale(6),
  },
  giftButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.normal || colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  messageInputWrapper: {
    flex: 1,
  },
});
