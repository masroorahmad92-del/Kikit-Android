import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import {ChannelList, useChatContext} from 'stream-chat-react-native';
import {colors, moderateScale} from '../../theme';
import {CheckDouble, GiftIcon} from '../../assets/icons';

const Chats = ({navigation}) => {
  const {client} = useChatContext();

  const options = {
    presence: true,
    state: true,
    watch: true,
  };

  const filters = {
    members: {$in: [client.user.id]},
  };

  // Custom channel preview component - FIXED
  // eslint-disable-next-line react/no-unstable-nested-components
  const CustomChannelPreview = props => {
    const {channel} = props;
    const {client: chatClient} = useChatContext();

    // Get the other user in the channel
    const otherMember = Object.values(channel.state.members || {}).find(
      member => member.user?.id !== chatClient.user?.id,
    );

    const displayName = otherMember?.user?.name || 'Unknown User';
    const displayImage = otherMember?.user?.image;
    const isOnline = otherMember?.user?.online;

    // Get last message
    const messages = channel.state.messages || [];
    const lastMessage = messages[messages.length - 1];

    // Determine last message preview text (support audio/attachments)
    let lastMessageText = 'Nothing yet...';
    if (lastMessage) {
      if (lastMessage.text) {
        lastMessageText = lastMessage.text;
      } else if (lastMessage.attachments?.length > 0) {
        const att = lastMessage.attachments[0];
        if (att.type === 'audio' || att.mime_type?.startsWith('audio')) {
          lastMessageText = '🎵 Audio message';
        } else if (att.type === 'image') {
          lastMessageText = '📷 Photo';
        } else if (att.type === 'video') {
          lastMessageText = '📹 Video';
        } else {
          lastMessageText = '📎 Attachment';
        }
      }
    }

    const lastMessageTime = lastMessage?.created_at;
    const isMyMessage = lastMessage?.user?.id === chatClient.user?.id;

    // Determine tick status for my last message
    // Stream Chat read state: channel.state.read is a map of userId -> {last_read, unread_messages}
    // lastMessage.status: 'sending' | 'sent' (confirmed by server) — pending vs delivered
    let tickStatus = null; // null = no tick, 'sent' = single grey, 'delivered' = double grey, 'seen' = double blue
    if (isMyMessage && lastMessage) {
      const msgStatus = lastMessage.status; // 'sending' or 'sent' (Stream sets this on local messages)
      const otherMemberId = otherMember?.user?.id;
      const readData = otherMemberId && channel.state.read?.[otherMemberId];

      if (msgStatus === 'sending') {
        // Still being sent to server — single tick
        tickStatus = 'sent';
      } else if (readData && lastMessage.created_at) {
        const msgTime = new Date(lastMessage.created_at).getTime();
        const lastReadTime = new Date(readData.last_read).getTime();
        if (lastReadTime >= msgTime) {
          tickStatus = 'seen'; // double blue — other user has read it
        } else {
          tickStatus = 'delivered'; // double grey — on server, not yet read
        }
      } else {
        // Message is on server but no read data yet — double grey
        tickStatus = 'delivered';
      }
    }

    // Unread count
    const unreadCount = channel.state.unreadCount || 0;

    // Format timestamp
    const formatTime = date => {
      if (!date) return '';
      const messageDate = new Date(date);
      const now = new Date();
      const diffInHours = (now - messageDate) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return messageDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return messageDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
    };

    return (
      <TouchableOpacity
        style={styles.channelItem}
        onPress={() => navigation.navigate('chat', {channel})}
        activeOpacity={0.7}>
        {/* Avatar with online indicator */}
        <View style={styles.avatarContainer}>
          {displayImage ? (
            <Image source={{uri: displayImage}} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        {/* Channel content */}
        <View style={styles.channelContent}>
          <View style={styles.channelHeader}>
            <Text style={styles.channelName} numberOfLines={1}>
              {displayName}
            </Text>
            {lastMessageTime && (
              <Text style={styles.timestamp}>
                {formatTime(lastMessageTime)}
              </Text>
            )}
          </View>

          <View style={styles.messageRow}>
            <Text
              style={[
                styles.lastMessage,
                unreadCount > 0 && styles.lastMessageUnread,
              ]}
              numberOfLines={1}>
              {isMyMessage && 'You: '}
              {lastMessageText}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
            {tickStatus === 'sent' && (
              <Text style={styles.singleTick}>✓</Text>
            )}
            {tickStatus === 'delivered' && (
              <CheckDouble width={16} height={16} stroke="#8E8E93" />
            )}
            {tickStatus === 'seen' && (
              <CheckDouble width={16} height={16} stroke="#007AFF" />
            )}
          </View>
        </View>

        {/* Gift Icon Button */}
        <TouchableOpacity
          style={styles.giftButton}
          onPress={() => navigation.navigate('GiftList', {recipientId: otherMember?.user?.id})}
          activeOpacity={0.7}>
          <GiftIcon width={24} height={24} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.gradientBG || '#4FC3F7'}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
        <Text style={styles.subtitle}>
          Conversations from live room connections.
        </Text>
      </View>

      {/* Channel List */}
      <View style={styles.listContainer}>
        <ChannelList
          options={options}
          filters={filters}
          onSelect={channel => {
            navigation.navigate('chat', {channel});
          }}
          Preview={CustomChannelPreview}
          // eslint-disable-next-line react/no-unstable-nested-components
          EmptyStateIndicator={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No chats yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Live room conversations will appear here.
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default Chats;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientBG || '#FFFFFF',
  },
  header: {
    paddingHorizontal: moderateScale(20),
    paddingTop: Platform.OS === 'ios' ? moderateScale(8) : moderateScale(16),
    paddingBottom: moderateScale(16),
    backgroundColor: colors.gradientBG || '#4FC3F7',
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    color: colors.grey800 || '#000000',
    marginBottom: moderateScale(4),
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: moderateScale(15),
    fontWeight: '400',
    color: colors.grey800 || '#000000',
    lineHeight: moderateScale(20),
    opacity: 0.85,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: moderateScale(12),
  },
  avatar: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: '#E0E0E0',
  },
  avatarPlaceholder: {
    backgroundColor: '#4FC3F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: moderateScale(22),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: moderateScale(2),
    right: moderateScale(2),
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    backgroundColor: '#4CAF50',
    borderWidth: moderateScale(2),
    borderColor: '#FFFFFF',
  },
  channelContent: {
    flex: 1,
    justifyContent: 'center',
    marginRight: moderateScale(8),
  },
  giftButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: colors.normal,
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
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  channelName: {
    fontSize: moderateScale(17),
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: moderateScale(8),
  },
  timestamp: {
    fontSize: moderateScale(13),
    fontWeight: '400',
    color: '#8E8E93',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: moderateScale(15),
    fontWeight: '400',
    color: '#8E8E93',
    flex: 1,
    marginRight: moderateScale(8),
  },
  lastMessageUnread: {
    fontWeight: '500',
    color: '#000000',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: moderateScale(10),
    minWidth: moderateScale(20),
    height: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(6),
    marginLeft: moderateScale(4),
  },
  unreadText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkmark: {
    fontSize: moderateScale(14),
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: moderateScale(4),
  },
  singleTick: {
    fontSize: moderateScale(14),
    color: '#8E8E93',
    fontWeight: '600',
    marginLeft: moderateScale(4),
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(40),
    paddingTop: moderateScale(100),
  },
  emptyStateText: {
    fontSize: moderateScale(20),
    fontWeight: '600',
    color: '#000000',
    marginBottom: moderateScale(8),
  },
  emptyStateSubtext: {
    fontSize: moderateScale(15),
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
  },
});
