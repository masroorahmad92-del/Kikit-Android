import React, {useState, useEffect, useCallback} from 'react';
import {View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Linking} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {colors, moderateScale} from '../../theme';
import {Text} from '../../components/base/Text';
import ProfileHeader from '../../components/ProfileHeader';
import PointsCard from '../../components/PointsCard';
import MenuItem from '../../components/MenuItem';
import CollapsibleMenuItem from '../../components/CollapsibleMenuItem';
import ConfirmationModal from '../../components/ConfirmationModal';
import {
  Settings,
  Logout,
  Trash,
  User,
  Bell,
  Coin,
  StarIcon,
} from '../../assets/icons';
import {useKitkitStore} from '../../store/kitkitStore';
import {userService} from '../../api/services/userService';
import Toast from 'react-native-toast-message';
import {useMutation} from '@tanstack/react-query';
import {revenueCatLogout} from '../../utils/revenueCatHelper';
import notificationService from '../../services/NotificationService';

const ProfileScreen = ({navigation}) => {
  const {userProfile, setUserProfile, removeUser, isPremium, activePlan} = useKitkitStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: () => userService.deleteMyAccount(),
    onSuccess: async () => {
      console.log('Account deleted successfully');
      setShowDeleteModal(false);

      Toast.show({
        type: 'success',
        text1: 'Account Deleted',
        text2: 'Your account has been deleted successfully',
      });

      // Log out from RevenueCat
      await revenueCatLogout();
      // Clear all user data from store
      removeUser();
    },
    onError: (error) => {
      console.error('Failed to delete account:', error);
      setShowDeleteModal(false);

      const errorMessage =
        error?.message || 'Failed to delete account. Please try again.';

      Toast.show({
        type: 'error',
        text1: 'Deletion Failed',
        text2: errorMessage,
      });
    },
  });

  // Fetch user profile if not available on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userProfile) {
        setIsLoading(true);
        try {
          const response = await userService.getMyProfile();
          const profileData = response?.data?.data;
          if (profileData) {
            setUserProfile(profileData);
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          Toast.show({
            type: 'error',
            text1: 'Failed to load profile',
            text2: error?.message || 'Please try again later',
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch profile whenever this screen gains focus (e.g. returning from EditProfile)
  useFocusEffect(
    useCallback(() => {
      const refreshProfile = async () => {
        try {
          const response = await userService.getMyProfile();
          const freshData = response?.data?.data;
          if (freshData) {
            setUserProfile(freshData);
          }
        } catch (error) {
          console.error('Failed to refresh profile:', error);
        }
      };

      refreshProfile();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const handleVerifyProfile = () => {
    console.log('Verify Profile');
    navigation.navigate('ProfileVerification');
  };

  const handleEditProfile = () => {
    console.log('Edit Profile');
    navigation.navigate('EditProfile');
  };

  const handleGetPoints = () => {
    navigation.navigate('MyPoints');
  };

  const handlePayout = () => {
    navigation.navigate('Payout');
  };

  const handleWallet = () => {
    navigation.navigate('Wallet');
  };

  const handleSubscription = () => {
    navigation.navigate('Subscription');
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await userService.logout();
    } catch (e) {
      console.log('Backend logout failed (proceeding with local cleanup):', e);
    }
    await revenueCatLogout();
    await notificationService.deleteFCMToken();
    await notificationService.cancelAllNotifications();
    removeUser();
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    // Call delete account mutation
    deleteAccountMutation.mutate();
  };

  const handleBlockedProfiles = () => {
    navigation.navigate('BlockedProfiles');
  };

  const handleNotifications = () => {
    navigation.navigate('Notifications');
  };

  const appSettingsSubItems = [
    {
      title: 'Privacy policy',
      onPress: () => Linking.openURL('https://www.letskikit.com/privacy'),
    },
    {
      title: 'Terms & Conditions',
      onPress: () => Linking.openURL('https://www.letskikit.com/terms'),
    },
    {
      title: 'Contact Us',
      onPress: () => Linking.openURL('https://www.letskikit.com/contact'),
    },
  ];

  // Extract data from userProfile
  const userName = userProfile?.name || 'User';
  const primaryPhoto = userProfile?.photos?.find(p => p.is_primary);
  const fallbackPhoto = userProfile?.photos?.[0];
  const avatarUrl = primaryPhoto?.url || fallbackPhoto?.url;
  const userAvatar = avatarUrl
    ? {uri: avatarUrl}
    : require('../../assets/images/jasmeen-turman.jpeg');
  const isVerified = userProfile?.is_profile_verified || false;
  const userPoints = userProfile?.user?.coin_balance || 0;
  const userDiamonds = userProfile?.user?.diamond_balance || 0;

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text ff="c-Regular" fs="L" color="grey800" style={styles.loadingText}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text ff="c-Regular" fs="XXXL" color="grey800" style={styles.title}>
            Profile
          </Text>
          <Text ff="c-Regular" fs="M" color="grey800" style={styles.subtitle}>
            Manage your verified member profile, gifts, and community settings.
          </Text>
        </View>

        {/* Profile Header */}
        <ProfileHeader
          name={userName}
          avatar={userAvatar}
          isVerified={isVerified}
          isPremium={isPremium}
          activePlan={activePlan}
          onPressVerify={handleVerifyProfile}
          onPressEdit={handleEditProfile}
        />

        {/* Points Card */}
        <PointsCard points={userPoints} diamonds={userDiamonds} onPress={handleGetPoints} onPayoutPress={handlePayout} />

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {/* <MenuItem
            icon={<Bell width={24} height={24} stroke={colors.secondary} />}
            title="Notifications"
            onPress={handleNotifications}
          /> */}

          {/* <MenuItem
            icon={<User width={24} height={24} stroke={colors.secondary} />}
            title="Block List"
            onPress={handleBlockList}
          /> */}

          <MenuItem
            icon={<StarIcon width={24} height={24} fill={colors.white} />}
            title={isPremium ? `Premium (${activePlan === 'annual' ? 'Annual' : activePlan === 'monthly' ? 'Monthly' : 'Active'})` : 'Go Premium'}
            onPress={handleSubscription}
            iconBgColor={colors.primary}
          />

          {/* <MenuItem
            icon={<Coin width={24} height={24} />}
            title="My Wallet"
            onPress={handleWallet}
          /> */}

          <MenuItem
            icon={<Bell width={24} height={24} stroke={colors.secondary} />}
            title="Notifications"
            onPress={handleNotifications}
          />

          <MenuItem
            icon={<User width={24} height={24} stroke={colors.secondary} />}
            title="Blocked Members"
            onPress={handleBlockedProfiles}
          />

          <CollapsibleMenuItem
            icon={<Settings width={24} height={24} stroke={colors.secondary} />}
            title="App Settings"
            subItems={appSettingsSubItems}
            defaultExpanded={true}
          />

          {/* Logout */}
          <MenuItem
            icon={<Logout width={24} height={24} stroke={colors.danger} />}
            title="Logout"
            onPress={handleLogout}
            showChevron={false}
            textColor="danger"
          />

          {/* Delete Account */}
          <MenuItem
            icon={<Trash width={24} height={24} stroke={colors.danger} />}
            title="Delete Account"
            onPress={handleDeleteAccount}
            showChevron={false}
            textColor="danger"
          />
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        icon={<Logout width={60} height={60} stroke={colors.danger} />}
        title="Logout"
        message="Are you sure you want to log out? You can log back in anytime"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        icon={<Trash width={60} height={60} stroke={colors.danger} />}
        title="Delete Account"
        message="Are you sure about this? All data and progress associated with this account will be permanently removed. This step cannot be undone. If you have any active subscription to Kikit App, please cancel the subscription first through iTunes/Google Play before deleting this account."
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        emphasizeCancel
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientBG,
  },
  scrollContent: {
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(30),
  },
  header: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  title: {
    marginBottom: moderateScale(5),
    fontWeight: '700',
  },
  subtitle: {
    fontWeight: '400',
  },
  menuContainer: {
    marginTop: moderateScale(10),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  loadingText: {
    marginTop: moderateScale(16),
    textAlign: 'center',
  },
});

export default ProfileScreen;

