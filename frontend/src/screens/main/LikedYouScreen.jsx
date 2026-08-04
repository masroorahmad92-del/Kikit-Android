import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {Text} from '../../components/base/Text';
import SearchBar from '../../components/SearchBar';
import {Search, ThreeHearts} from '../../assets/icons';
import {colors, moderateScale} from '../../theme';
import {matchesService} from '../../api/services/matchesService';
import {useKitkitStore} from '../../store/kitkitStore';
import {getPrimaryPhoto} from '../../utils/helpers';

const calculateAge = dob => {
  if (!dob) {
    return null;
  }
  const [day, month, year] = dob.includes('/') ? dob.split('/') : dob.split('-');
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getImageSource = profile => {
  const primaryPhoto = getPrimaryPhoto(profile?.photos);
  if (primaryPhoto?.url) {
    return {uri: primaryPhoto.url};
  }
  const firstPhoto = profile?.photos?.[0]?.url;
  return firstPhoto
    ? {uri: firstPhoto}
    : require('../../assets/images/image-placegolder.png');
};

const transformSparkData = profiles =>
  (profiles || []).map(profile => ({
    id: profile.id,
    name: profile.name || 'Unknown',
    age: calculateAge(profile.dob) || 'N/A',
    distance:
      profile.distance_km !== undefined && profile.distance_km !== null
        ? `${(parseFloat(profile.distance_km) * 0.621371).toFixed(1)} miles away`
        : '',
    image: getImageSource(profile),
    incomingSpark: profile.incoming_spark,
    originalData: profile,
  }));

const SparkCard = ({item, onView, onSparkBack, onPass, processing}) => {
  const spark = item.incomingSpark;
  const source = spark?.category_name || spark?.interest_name;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={onView}>
      <Image source={item.image} style={styles.avatar} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.nameWrap}>
            <Text ff="c-Bold" fs="L" color="grey800" numberOfLines={1}>
              {item.name}, {item.age}
            </Text>
            {!!item.distance && (
              <Text ff="c-Regular" fs="XS" color="grey400" numberOfLines={1}>
                {item.distance}
              </Text>
            )}
          </View>
          <View style={styles.sparkPill}>
            <Text ff="c-Bold" fs="XXS" color="secondary">Spark</Text>
          </View>
        </View>

        <Text ff="c-Regular" fs="S" color="grey800" style={styles.sourceText}>
          {source ? `Sent you a Spark through ${source}` : 'Sent you a Spark'}
        </Text>

        {spark?.question && (
          <Text ff="c-Bold" fs="S" color="grey800" style={styles.question}>
            {spark.question}
          </Text>
        )}
        {spark?.answer && (
          <Text ff="c-Regular" fs="S" color="grey400" style={styles.answer} numberOfLines={3}>
            {spark.answer}
          </Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.passButton}
            disabled={processing}
            onPress={onPass}>
            <Text ff="c-Bold" fs="S" color="grey800">Pass</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewButton}
            disabled={processing}
            onPress={onView}>
            <Text ff="c-Bold" fs="S" color="grey800">View Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sparkBackButton, processing && styles.disabledButton]}
            disabled={processing}
            onPress={onSparkBack}>
            {processing ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text ff="c-Bold" fs="S" color="white">Spark Back</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const LikedYouScreen = ({navigation}) => {
  const {userProfile} = useKitkitStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingProfileId, setProcessingProfileId] = useState(null);

  const fetchSparks = async (isRefreshing = false) => {
    if (!userProfile?.id) {
      return;
    }
    if (!isRefreshing) {
      setIsLoading(true);
    }
    try {
      const response = await matchesService.getLikedMe(userProfile.id);
      const likedProfiles = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];
      setProfiles(transformSparkData(likedProfiles));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not load Sparks',
        text2: error?.response?.data?.message || 'Please try again.',
      });
      setProfiles([]);
    } finally {
      if (!isRefreshing) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSparks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSparks(true);
    setRefreshing(false);
  };

  const handleView = item => {
    navigation.navigate('ProfileDetail', {item});
  };

  const handleSparkBack = async item => {
    const profileId = item.originalData?.id || item.id;
    if (processingProfileId) {
      return;
    }
    setProcessingProfileId(profileId);
    try {
      const response = await matchesService.likeProfile(profileId);
      setProfiles(prev => prev.filter(profile => profile.id !== item.id));
      Toast.show({
        type: 'success',
        text1: response?.data?.data?.is_matched ? 'Spark connected' : 'Spark sent',
        text2: response?.data?.data?.is_matched
          ? 'A conversation is ready when you are.'
          : 'They will see your Spark.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Spark failed',
        text2: error?.response?.data?.message || 'Please try again.',
      });
    } finally {
      setProcessingProfileId(null);
    }
  };

  const handlePass = async item => {
    const profileId = item.originalData?.id || item.id;
    if (processingProfileId) {
      return;
    }
    setProcessingProfileId(profileId);
    try {
      await matchesService.deleteProfileLike(profileId);
      setProfiles(prev => prev.filter(profile => profile.id !== item.id));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not pass',
        text2: error?.response?.data?.message || 'Please try again.',
      });
    } finally {
      setProcessingProfileId(null);
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text ff="c-Bold" fs="XXXL" color="grey800" style={styles.title}>
          Sparks
        </Text>
        <Text ff="c-Regular" fs="S" color="grey400" style={styles.subtitle}>
          People who opened with a shared interest appear here.
        </Text>
      </View>

      <SearchBar
        placeholder="Search Sparks"
        value={searchQuery}
        onChangeText={setSearchQuery}
        icon={<Search width={20} height={20} stroke={colors.grey400} />}
        containerStyle={styles.searchBar}
      />

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.secondary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredProfiles}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => (
            <SparkCard
              item={item}
              onView={() => handleView(item)}
              onSparkBack={() => handleSparkBack(item)}
              onPass={() => handlePass(item)}
              processing={processingProfileId === (item.originalData?.id || item.id)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            filteredProfiles.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThreeHearts width={76} height={76} fill={colors.secondary} />
              <Text ff="c-Bold" fs="XXL" color="grey800" style={styles.emptyTitle}>
                No Sparks yet
              </Text>
              <Text ff="c-Regular" fs="S" color="grey400" style={styles.emptyText}>
                When someone starts with a shared interest, their Spark will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientBG,
  },
  header: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(12),
  },
  title: {
    marginBottom: moderateScale(5),
  },
  subtitle: {
    lineHeight: moderateScale(20),
  },
  searchBar: {
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(16),
  },
  listContent: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(26),
    gap: moderateScale(14),
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    shadowColor: colors.grey800,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  avatar: {
    width: moderateScale(92),
    height: moderateScale(116),
    borderRadius: moderateScale(8),
    backgroundColor: colors.grey100,
  },
  cardContent: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(8),
  },
  nameWrap: {
    flex: 1,
  },
  sparkPill: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(14),
    backgroundColor: colors.grey50,
    alignSelf: 'flex-start',
  },
  sourceText: {
    marginTop: moderateScale(8),
  },
  question: {
    marginTop: moderateScale(8),
  },
  answer: {
    marginTop: moderateScale(4),
    lineHeight: moderateScale(18),
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginTop: moderateScale(12),
  },
  passButton: {
    paddingHorizontal: moderateScale(12),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.grey50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButton: {
    paddingHorizontal: moderateScale(12),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.grey50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkBackButton: {
    flex: 1,
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.55,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(24),
  },
  emptyTitle: {
    marginTop: moderateScale(18),
    textAlign: 'center',
  },
  emptyText: {
    marginTop: moderateScale(8),
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
});

export default LikedYouScreen;
