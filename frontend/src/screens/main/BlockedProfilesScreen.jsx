import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';

import {ArrowBack, User} from '../../assets/icons';
import {matchesService} from '../../api/services/matchesService';
import {Text} from '../../components/base/Text';
import {colors, moderateScale} from '../../theme';

const calculateAge = dob => {
  if (!dob) {
    return null;
  }

  const parts = dob.includes('-') ? dob.split('-') : dob.split('/');
  if (parts.length !== 3) {
    return null;
  }

  const [day, month, year] = parts;
  const birthDate = new Date(year, month - 1, day);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const transformBlockedProfiles = profiles =>
  (profiles || []).map(profile => {
    const primaryPhoto =
      profile.photos?.find(photo => photo.is_primary)?.url || profile.photos?.[0]?.url;

    return {
      id: profile.id,
      userId: profile.blocked_user_id || profile.user?.id,
      name: profile.name || 'Unknown',
      age: calculateAge(profile.dob),
      image: primaryPhoto
        ? {uri: primaryPhoto}
        : require('../../assets/images/image-placegolder.png'),
    };
  });

const BlockedProfilesScreen = ({navigation}) => {
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingUserId, setProcessingUserId] = useState(null);

  const fetchBlockedProfiles = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) {
      setIsLoading(true);
    }

    try {
      const response = await matchesService.getBlockedUsers();
      const blockedProfiles = response?.data?.data?.profiles || [];
      setProfiles(transformBlockedProfiles(blockedProfiles));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load blocked profiles',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Please try again later',
      });
      setProfiles([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBlockedProfiles();
    }, [fetchBlockedProfiles]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBlockedProfiles(true);
  };

  const handleUnblock = async item => {
    if (!item.userId || processingUserId) {
      return;
    }

    try {
      setProcessingUserId(item.userId);
      await matchesService.unblockUser(item.userId);
      setProfiles(prev => prev.filter(profile => profile.userId !== item.userId));
      Toast.show({
        type: 'success',
        text1: 'User Unblocked',
        text2: `${item.name} has been unblocked.`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Unblock Failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Please try again.',
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const renderProfile = ({item}) => {
    const isProcessing = processingUserId === item.userId;

    return (
      <View style={styles.profileItem}>
        <FastImage source={item.image} style={styles.avatar} />
        <View style={styles.profileInfo}>
          <Text ff="c-Regular" fs="L" color="grey800" style={styles.profileName}>
            {item.name}
          </Text>
          {item.age ? (
            <Text ff="c-Regular" fs="S" color="grey500">
              {item.age} years old
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.unblockButton, isProcessing && styles.disabledButton]}
          onPress={() => handleUnblock(item)}
          disabled={isProcessing}
          activeOpacity={0.7}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text ff="c-Regular" fs="S" color="white" style={styles.unblockText}>
              Unblock
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <User width={48} height={48} stroke={colors.grey400} />
      </View>
      <Text ff="c-Regular" fs="XXL" color="grey800" style={styles.emptyTitle}>
        No Blocked Profiles
      </Text>
      <Text ff="c-Regular" fs="M" color="grey400" style={styles.emptyText}>
        People you block will appear here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <ArrowBack width={24} height={24} stroke={colors.grey800} />
        </TouchableOpacity>
        <Text ff="c-Regular" fs="XXXL" color="grey800" style={styles.title}>
          Blocked Profiles
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={profiles}
          renderItem={renderProfile}
          keyExtractor={item => item.userId || item.id}
          contentContainerStyle={[
            styles.listContent,
            profiles.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default BlockedProfilesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientBG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(20),
  },
  backButton: {
    marginRight: moderateScale(16),
    padding: moderateScale(4),
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(24),
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    marginBottom: moderateScale(12),
    shadowColor: colors.grey800,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: colors.grey100,
    marginRight: moderateScale(12),
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: '600',
    marginBottom: moderateScale(4),
  },
  unblockButton: {
    minWidth: moderateScale(92),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  unblockText: {
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: moderateScale(24),
  },
  emptyIcon: {
    width: moderateScale(88),
    height: moderateScale(88),
    borderRadius: moderateScale(44),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(18),
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});
