import React from 'react';
import {View, TouchableOpacity, StyleSheet, Image} from 'react-native';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';
import {CheckDouble} from '../assets/icons';

const ChatItem = ({
  item,
  onPress,
  containerStyle,
}) => {
  const {
    name,
    message,
    time,
    avatar,
    isOnline,
    unreadCount,
    isRead,
  } = item;

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Avatar with Online Status */}
      <View style={styles.avatarContainer}>
        <Image source={avatar} style={styles.avatar} />
        {isOnline && <View style={styles.onlineIndicator} />}
      </View>

      {/* Chat Content */}
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text ff="c-Regular" fs="L" color="grey800" style={styles.name}>
            {name}
          </Text>
          <Text ff="c-Regular" fs="XS" color="grey400" style={styles.time}>
            {time}
          </Text>
        </View>

        <View style={styles.messageRow}>
          <Text
            ff="c-Regular"
            fs="M"
            color={unreadCount > 0 ? 'grey800' : 'grey500'}
            style={styles.message}
            numberOfLines={1}>
            {message}
          </Text>

          {/* Unread Indicator or Read Receipt */}
          {unreadCount > 0 ? (
            <View style={styles.unreadBadge} />
          ) : isRead ? (
            <CheckDouble width={16} height={16} stroke={colors.normal} />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: moderateScale(12),
  },
  avatar: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: colors.grey200,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: moderateScale(2),
    right: moderateScale(2),
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: colors.gradientBG,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  name: {
    fontWeight: '700',
    flex: 1,
  },
  time: {
    marginLeft: moderateScale(8),
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    flex: 1,
    fontWeight: '400',
  },
  unreadBadge: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: colors.secondary,
    marginLeft: moderateScale(8),
  },
});

export default ChatItem;

