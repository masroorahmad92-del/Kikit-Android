import React, {useState, useRef, useEffect, forwardRef, useImperativeHandle} from 'react';
import {View, StyleSheet, TouchableOpacity, Animated, ActivityIndicator} from 'react-native';
import {Text} from '../base/Text';
import {colors, fonts, moderateScale, verticalScale} from '../../theme';
import {ArrowDown, ArrowUp, Music, Sports, Travel} from '../../assets/icons';
import {useQuery} from '@tanstack/react-query';
import {preferencesService} from '../../api/services/preferencesService';

const InterestsComponent = forwardRef(({isVisible, interests, setInterests}, ref) => {
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacityAnim = useRef(new Animated.Value(0)).current;
  const categoriesShakeAnim = useRef(new Animated.Value(0)).current;

  const [expandedCategories, setExpandedCategories] = useState({});
  // Fetch interests from API with caching
  const {data: interestsData, isLoading, isError} = useQuery({
    queryKey: ['interests'],
    queryFn: async () => {
      const response = await preferencesService.getInterests();
      // API returns an array, convert to object keyed by category name
      const data = response.data;
      if (Array.isArray(data)) {
        return data.reduce((acc, category) => {
          acc[category.name] = {
            id: category.id,
            interests: category.interests,
          };
          return acc;
        }, {});
      }
      return data;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  });

  // Set initial expanded state when data is loaded
  useEffect(() => {
    if (interestsData && Object.keys(expandedCategories).length === 0) {
      const firstCategory = Object.keys(interestsData)[0];
      setExpandedCategories({
        [firstCategory]: true,
      });
    }
  }, [interestsData, expandedCategories]);

  useEffect(() => {
    if (isVisible) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Force first category to be expanded after component mounts
      if (interestsData) {
        const firstCategory = Object.keys(interestsData)[0];
        setTimeout(() => {
          setExpandedCategories(prev => ({
            ...prev,
            [firstCategory]: true,
          }));
        }, 100);

        // Additional force update
        setTimeout(() => {
          setExpandedCategories(prev => ({
            ...prev,
            [firstCategory]: true,
          }));
        }, 800);
      }
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -30,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, fadeAnim, slideAnim, interestsData]);

  // Map icons to categories (fallback for API data)
  const categoryIcons = {
    Travel: <Travel />,
    Sports: <Sports />,
    Music: <Music />,
  };

  // Process API data or use empty object
  const interestCategories = interestsData || {};

  const toggleCategory = category => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const triggerErrorAnimation = () => {
    // Shake animation for error text
    Animated.sequence([
      Animated.timing(errorShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Shake animation for categories
    Animated.sequence([
      Animated.timing(categoriesShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(categoriesShakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(categoriesShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(categoriesShakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade in error message
    Animated.timing(errorOpacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const toggleInterest = interest => {
    const normalizeInterest = item => {
      if (typeof item === 'string') {
        return {
          id: item,
          name: item,
          category_id: null,
          category_name: '',
        };
      }
      return {
        ...item,
        id: item?.id || item?.name,
      };
    };

    const normalizedInterest = normalizeInterest(interest);

    const getInterestId = item =>
      typeof item === 'string' ? item : item?.id || item?.name;

    setInterests(prev => {
      const isSelected = prev.some(
        item => getInterestId(item) === normalizedInterest.id,
      );

      if (isSelected) {
        return prev.filter(item => getInterestId(item) !== normalizedInterest.id);
      }
      return [...prev, normalizedInterest];
    });

    // Clear error when user makes a selection
    if (error) {
      Animated.timing(errorOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setError('');
      });
    }
  };

  // Expose validate method to parent component
  useImperativeHandle(ref, () => ({
    validate: () => {
      const count = Array.isArray(interests) ? interests.length : 0;
      if (count < 6) {
        setError(`Please select at least 6 interests (${count}/6 selected)`);
        triggerErrorAnimation();
        return false;
      }
      return true;
    },
  }));

  if (!isVisible) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text fs="M" color="grey800" style={styles.loadingText}>
          Loading interests...
        </Text>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text fs="L" color="danger" style={styles.errorTitle}>
          Failed to load interests
        </Text>
        <Text fs="M" color="grey800">
          Please check your connection and try again.
        </Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text fs="XXXL" color="grey800" style={styles.title}>
          What's your
          <Text color="primary"> interests?</Text>
        </Text>
        <Text fs="M" color="grey800" style={styles.subtitle}>
          Select what excites you to connect with people.
        </Text>
        <Text fs="S" color="grey800" style={styles.instruction}>
          Choose at least 6 things you like.
        </Text>
      </View>

      {/* Interest Categories */}
      <Animated.ScrollView
        style={[
          styles.categoriesContainer,
          {
            transform: [{translateX: categoriesShakeAnim}],
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {Object.entries(interestCategories).map(([category, data]) => {
          // Handle both API format and fallback format
          const categoryData = data.interests ? data : {interests: data};
          const categoryId = data.id || null;
          const icon = categoryIcons[category] || categoryIcons.Travel;

          return (
            <View key={category} style={styles.categoryCard}>
              {/* Category Header */}
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category)}
                activeOpacity={0.7}>
                <View style={styles.categoryHeaderLeft}>
                  <Text style={styles.categoryIcon}>{icon}</Text>
                  <Text fs="L" color="grey800" style={styles.categoryTitle}>
                    {category}
                  </Text>
                </View>
                <Text style={styles.chevronIcon}>
                  {expandedCategories[category] ? <ArrowUp /> : <ArrowDown />}
                </Text>
              </TouchableOpacity>

              {/* Category Interests */}
              {expandedCategories[category] && (
                <Animated.View
                  style={[
                    styles.categoryContent,
                    expandedCategories[category]
                      ? styles.categoryContentExpanded
                      : styles.categoryContentCollapsed,
                  ]}>
                  <View style={styles.separator} />
                  <View style={styles.interestsGrid}>
                    {categoryData.interests.map((interest, index) => {
                      const interestName =
                        typeof interest === 'string' ? interest : interest.name;
                      const interestId =
                        (typeof interest === 'string'
                          ? interest
                          : interest?.id) || interestName;
                      const enrichedInterest =
                        typeof interest === 'string'
                          ? {
                              id: interestId,
                              name: interest,
                              category_id: categoryId,
                              category_name: category,
                            }
                          : {
                              ...interest,
                              id: interestId,
                              category_id:
                                interest?.category_id ?? categoryId ?? null,
                              category_name: category,
                            };

                      const isSelected = interests.some(item => {
                        const itemId =
                          typeof item === 'string'
                            ? item
                            : item?.id || item?.name;
                        return itemId === interestId;
                      });

                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.interestTag,
                            isSelected && styles.selectedInterestTag,
                          ]}
                          onPress={() => toggleInterest(enrichedInterest)}
                          activeOpacity={0.7}>
                          <Text
                            fs="S"
                            ff="c-medium"
                            color={isSelected ? 'grey800' : 'grey800'}
                            style={[
                              styles.interestText,
                              isSelected && styles.selectedInterestText,
                            ]}>
                            {interestName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Animated.View>
              )}
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Animated Error Message */}
      {error ? (
        <Animated.Text
          style={[
            styles.errorText,
            {
              opacity: errorOpacityAnim,
              transform: [{translateX: errorShakeAnim}],
            },
          ]}>
          {error}
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  titleSection: {
    marginBottom: verticalScale(30),
  },
  title: {
    textAlign: 'left',
    lineHeight: 40,
    marginBottom: moderateScale(8),
  },
  subtitle: {
    textAlign: 'left',
    lineHeight: 22,
    marginBottom: moderateScale(4),
  },
  instruction: {
    textAlign: 'left',
    lineHeight: 20,
  },
  categoriesContainer: {
    flex: 1,
    marginBottom: verticalScale(20),
  },
  categoryCard: {
    // backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: moderateScale(16),
    marginBottom: moderateScale(16),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth:1,
    borderColor:colors.white,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(16),
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: moderateScale(12),
  },
  categoryTitle: {
    fontFamily: fonts.CabinetBold,
  },
  chevronIcon: {
    fontSize: 16,
    color: colors.grey800,
  },
  categoryContent: {
    overflow: 'hidden',
  },
  categoryContentExpanded: {
    opacity: 1,
    maxHeight: 1000,
  },
  categoryContentCollapsed: {
    opacity: 0,
    maxHeight: 0,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: moderateScale(16),
    borderStyle: 'dashed',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: moderateScale(16),
    gap: moderateScale(8),
  },
  interestTag: {
    padding:moderateScale(14),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: moderateScale(8),
  },
  selectedInterestTag: {
    backgroundColor: '#F8F0FC',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  interestText: {
    textAlign: 'center',
    fontFamily: fonts.CabinetRegular,
  },
  selectedInterestText: {
    fontFamily: fonts.CabinetBold,
  },
  errorText: {
    marginTop: moderateScale(10),
    marginBottom: moderateScale(10),
    textAlign: 'center',
    color: colors.error || '#EF4444',
    fontSize: moderateScale(14),
    fontFamily: fonts.CabinetMedium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  loadingText: {
    marginTop: moderateScale(16),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  errorTitle: {
    marginBottom: moderateScale(8),
  },
});

export default InterestsComponent;
