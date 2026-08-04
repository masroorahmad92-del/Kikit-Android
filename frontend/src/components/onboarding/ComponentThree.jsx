import React, {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from 'react';
import {Animated, StyleSheet, View, TouchableOpacity, ScrollView} from 'react-native';
import {Country, State, City} from 'country-state-city';
import {Text} from '../base/Text';
import {Input} from '../base/Input';
import {FadeModal} from '../base/FadeModal';
import {ArrowDown} from '../../assets/icons';
import {colors, fonts, moderateScale} from '../../theme';

const ComponentThree = forwardRef(({isVisible, location, setLocation}, ref) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacityAnim = useRef(new Animated.Value(0)).current;
  const inputShakeAnim = useRef(new Animated.Value(0)).current;
  const [locationError, setLocationError] = useState('');

  // Lazy load default country to prevent blocking render
  const getDefaultCountry = () => {
    return Country.getAllCountries().find(c => c.isoCode === 'US');
  };

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const countryModalRef = useRef(null);
  const cityModalRef = useRef(null);
  const stateModalRef = useRef(null);

  const normalizedPreferredIsoCodes = useMemo(
    () =>
      (location.preferredCountryIsoCodes || []).map(c =>
        String(c).toUpperCase(),
      ),
    [location.preferredCountryIsoCodes],
  );

  // Initialize country from existing location (e.g. preferences) or default US
  useEffect(() => {
    requestAnimationFrame(() => {
      const primaryFromCodes =
        normalizedPreferredIsoCodes.length > 0
          ? Country.getAllCountries().find(
              c => c.isoCode === normalizedPreferredIsoCodes[0],
            )
          : null;

      const prefCountry =
        location?.country && String(location.country).trim().length > 0
          ? Country.getAllCountries().find(c => c.name === location.country)
          : primaryFromCodes;

      if (prefCountry) {
        setSelectedCountry(prefCountry);
        setAvailableStates(State.getStatesOfCountry(prefCountry.isoCode));
        if (!location?.country || !String(location.country).trim()) {
          setLocation(prev => ({
            ...prev,
            country: prefCountry.name,
            country_code: prefCountry.phonecode,
            latitude: prefCountry.latitude || null,
            longitude: prefCountry.longitude || null,
          }));
        }
        return;
      }

      const defaultCountry = getDefaultCountry();
      setSelectedCountry(defaultCountry);

      if (defaultCountry) {
        setLocation(prev => ({
          ...prev,
          country: defaultCountry.name,
          country_code: defaultCountry.phonecode,
          latitude: defaultCountry.latitude || null,
          longitude: defaultCountry.longitude || null,
        }));
        const states = State.getStatesOfCountry(defaultCountry.isoCode);
        setAvailableStates(states);
      }
    });
  }, [
    location?.country,
    normalizedPreferredIsoCodes,
    setLocation,
  ]);

  // Update states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const states = State.getStatesOfCountry(selectedCountry.isoCode);
      setAvailableStates(states);
      // Reset state and city when country changes
      setSelectedState(null);
      setAvailableCities([]);
    }
  }, [selectedCountry]);

  // Update cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const cities = City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
      setAvailableCities(cities);
    } else {
      setAvailableCities([]);
    }
  }, [selectedState, selectedCountry]);

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

    // Shake animation for input field
    Animated.sequence([
      Animated.timing(inputShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputShakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputShakeAnim, {
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

  // Expose validation method to parent
  useImperativeHandle(ref, () => ({
    validate: () => {
      if (!location.country || location.country.trim().length === 0) {
        setLocationError('Country is required');
        triggerErrorAnimation();
        return false;
      }
      if (!location.state || location.state.trim().length === 0) {
        setLocationError('State is required');
        triggerErrorAnimation();
        return false;
      }
      // City is optional - no validation required
      setLocationError('');
      return true;
    },
  }));

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
  }, [isVisible, fadeAnim, slideAnim]);

  const handleCountrySelect = country => {
    setSelectedCountry(country);
    setLocation(prev => ({
      ...prev,
      country: country.name,
      country_code: country.phonecode,
      latitude: country.latitude || null,
      longitude: country.longitude || null,
      state: '',
      city: null,
      preferredCountryIsoCodes: [country.isoCode],
    }));
    countryModalRef.current?.close();
    // Clear error when country is selected
    if (locationError) {
      setLocationError('');
    }
  };

  const handleCountryModalOpen = () => {
    setCountrySearchQuery(''); // Clear search when opening
    countryModalRef.current?.open();
  };

  const handleStateSelect = () => {
    if (!selectedCountry) {
      setLocationError('Please select a country first');
      return;
    }
    if (availableStates.length === 0) {
      setLocationError('No states available for selected country');
      return;
    }
    setStateSearchQuery(''); // Clear search when opening
    stateModalRef.current?.open();
  };

  const handleCitySelect = () => {
    if (!selectedCountry) {
      setLocationError('Please select a country first');
      return;
    }
    if (!selectedState) {
      setLocationError('Please select a state first');
      return;
    }
    if (availableCities.length === 0) {
      setLocationError('No cities available for selected state');
      return;
    }
    setCitySearchQuery(''); // Clear search when opening
    cityModalRef.current?.open();
  };

  const handleStateConfirm = (state) => {
    setSelectedState(state);
    setLocation(prev => ({
      ...prev,
      state: state.name,
      city: null,
    }));
    stateModalRef.current?.close();
    // Clear error when state is selected
    if (locationError) {
      Animated.timing(errorOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setLocationError('');
      });
    }
  };

  const handleCityConfirm = (city) => {
    setLocation(prev => ({
      ...prev,
      city: city.name,
      // Update lat/lng to city coordinates if available
      latitude: city.latitude || prev.latitude,
      longitude: city.longitude || prev.longitude,
    }));
    cityModalRef.current?.close();
    // Clear error when city is selected
    if (locationError) {
      Animated.timing(errorOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setLocationError('');
      });
    }
  };

  const preferredIsoSet = useMemo(
    () => new Set(normalizedPreferredIsoCodes),
    [normalizedPreferredIsoCodes],
  );

  // Filter countries, then pin preferred ISO codes at top when not searching
  const orderedCountriesForModal = useMemo(() => {
    const q = countrySearchQuery.trim().toLowerCase();
    const allFiltered = Country.getAllCountries().filter(country =>
      country.name.toLowerCase().includes(q),
    );
    if (q || normalizedPreferredIsoCodes.length === 0) {
      return allFiltered;
    }
    const pinned = normalizedPreferredIsoCodes
      .map(iso => Country.getAllCountries().find(c => c.isoCode === iso))
      .filter(Boolean);
    const pinnedSet = new Set(pinned.map(c => c.isoCode));
    const rest = allFiltered.filter(c => !pinnedSet.has(c.isoCode));
    return [...pinned, ...rest];
  }, [countrySearchQuery, normalizedPreferredIsoCodes]);

  const countryFieldLabel = useMemo(() => {
    const codes = normalizedPreferredIsoCodes;
    if (codes.length > 0) {
      const names = codes
        .map(iso =>
          Country.getAllCountries().find(c => c.isoCode === iso)?.name,
        )
        .filter(Boolean);
      if (names.length > 0) {
        return names.join(', ');
      }
    }
    return location.country || 'Country';
  }, [normalizedPreferredIsoCodes, location.country]);

  // Filter states based on search query
  const filteredStates = availableStates.filter(state =>
    state.name.toLowerCase().includes(stateSearchQuery.toLowerCase()),
  );

  // Filter cities based on search query
  const filteredCities = availableCities.filter(city =>
    city.name.toLowerCase().includes(citySearchQuery.toLowerCase()),
  );

  if (!isVisible) {
    return null;
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
          Join Verified
          <Text color="primary"> Rooms</Text>
        </Text>
        <Text fs="M" ff="c-medium" color="grey800" style={styles.subtitle}>
          Select your location to personalize community rooms and regional recommendations.
        </Text>
      </View>

      {/* Location Input Fields */}
      <Animated.View
        style={[
          styles.inputSection,
          {
            transform: [{translateX: inputShakeAnim}],
          },
        ]}>
        {/* Country Selection */}
        <TouchableOpacity
          onPress={handleCountryModalOpen}
          style={[
            styles.inputContainer,
          ]}>
          <View style={styles.inputContent}>
            <Text
              fs="M"
              color="grey800"
              style={styles.inputLabel}
              numberOfLines={2}
              ellipsizeMode="tail">
              {countryFieldLabel}
            </Text>
            <ArrowDown />
          </View>
        </TouchableOpacity>

        {/* State Selection */}
        <TouchableOpacity
          onPress={handleStateSelect}
          style={[
            styles.inputContainer,
            !selectedCountry && styles.disabledInput,
            locationError && !location.state && styles.inputContainerError,
          ]}>
          <View style={styles.inputContent}>
            <Text
              fs="M"
              color={!selectedCountry ? 'grey400' : 'grey800'}
              style={styles.inputLabel}>
              {location.state || 'State'}
            </Text>
            <ArrowDown />
          </View>
        </TouchableOpacity>

        {/* City Selection (Optional) */}
        <TouchableOpacity
          onPress={handleCitySelect}
          style={[
            styles.inputContainer,
            (!selectedCountry || !selectedState) && styles.disabledInput,
          ]}>
          <View style={styles.inputContent}>
            <Text
              fs="M"
              color={!selectedCountry || !selectedState ? 'grey400' : 'grey800'}
              style={styles.inputLabel}>
              {location.city || 'City (Optional)'}
            </Text>
            <ArrowDown />
          </View>
        </TouchableOpacity>

        {/* Error Display */}
        {locationError ? (
          <Animated.Text
            style={[
              styles.errorText,
              {
                opacity: errorOpacityAnim,
                transform: [{translateX: errorShakeAnim}],
              },
            ]}>
            {locationError}
          </Animated.Text>
        ) : null}
      </Animated.View>

      {/* Country Selection Modal */}
      <FadeModal
        refRBSheet={countryModalRef}
        height={moderateScale(700)}
        header={true}
        headerTitle="Select Country"
        isButtonAdded={false}
        closeOnDragDown={true}
        closeOnPressMask={true}
        openDuration={300}>
        <View style={styles.modalContent}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Input
              placeholder="Search country..."
              placeholderTextColor={colors.grey400}
              value={countrySearchQuery}
              onChangeText={setCountrySearchQuery}
              style={styles.searchInput}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}>
            <View style={styles.countryList}>
              {!countrySearchQuery.trim() &&
                normalizedPreferredIsoCodes.length > 0 && (
                  <Text fs="S" color="grey400" style={styles.countrySectionLabel}>
                    Selected countries
                  </Text>
                )}
              {orderedCountriesForModal.length > 0 ? (
                orderedCountriesForModal.map(country => {
                  const isPreferred = preferredIsoSet.has(country.isoCode);
                  return (
                    <TouchableOpacity
                      key={country.isoCode}
                      style={[
                        styles.countryItem,
                        isPreferred && styles.countryItemSelected,
                      ]}
                      onPress={() => handleCountrySelect(country)}>
                      <Text
                        fs="M"
                        color={isPreferred ? 'primary' : 'grey800'}
                        style={styles.countryText}>
                        {country.flag} {country.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text fs="M" color="grey400" style={styles.emptyText}>
                  {countrySearchQuery ? 'No countries found matching your search' : 'No countries available'}
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </FadeModal>

      {/* State Selection Modal */}
      <FadeModal
        refRBSheet={stateModalRef}
        height={moderateScale(600)}
        header={true}
        headerTitle="Select State"
        isButtonAdded={false}
        closeOnDragDown={true}
        closeOnPressMask={true}
        openDuration={300}>
        <View style={styles.modalContent}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Input
              placeholder="Search state..."
              placeholderTextColor={colors.grey800}
              value={stateSearchQuery}
              onChangeText={setStateSearchQuery}
              style={styles.searchInput}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}>
            <View style={styles.stateList}>
              {filteredStates.length > 0 ? (
                filteredStates.map((state, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.stateItem}
                    onPress={() => handleStateConfirm(state)}>
                    <Text fs="M" color="grey800" style={styles.stateText}>
                      {state.name}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text fs="M" color="grey400" style={styles.emptyText}>
                  {stateSearchQuery ? 'No states found matching your search' : 'No states available'}
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </FadeModal>

      {/* City Selection Modal */}
      <FadeModal
        refRBSheet={cityModalRef}
        height={moderateScale(700)}
        header={true}
        headerTitle="Select City"
        isButtonAdded={false}
        closeOnDragDown={true}
        closeOnPressMask={true}
        openDuration={300}>
        <View style={styles.modalContent}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Input
              placeholder="Search city..."
              placeholderTextColor={colors.grey400}
              value={citySearchQuery}
              onChangeText={setCitySearchQuery}
              style={styles.searchInput}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}>
            <View style={styles.cityList}>
              {filteredCities.length > 0 ? (
                filteredCities.map((city, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.cityItem}
                    onPress={() => handleCityConfirm(city)}>
                    <Text fs="M" color="grey800" style={styles.cityText}>
                      {city.name}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text fs="M" color="grey400" style={styles.emptyText}>
                  {citySearchQuery ? 'No cities found matching your search' : 'No cities available'}
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </FadeModal>
    </Animated.View>
  );
});

ComponentThree.displayName = 'ComponentThree';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  titleSection: {
    marginBottom: moderateScale(40),
  },
  title: {
    lineHeight: 40,
    marginBottom: moderateScale(12),
  },
  subtitle: {
    lineHeight: 22,
  },
  inputSection: {
    gap: moderateScale(16),
  },
  inputContainer: {
    borderColor: colors.grey100,
    borderWidth: 1,
    borderRadius: moderateScale(50),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
  },
  inputContainerError: {
    borderColor: colors.error || '#EF4444',
    borderWidth: 2,
  },
  disabledInput: {
    // opacity: 0.6,
  },
  inputContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    flex: 1,
    fontFamily: fonts.CabinetRegular,
  },
  modalContent: {
    flex: 1,
    paddingVertical: moderateScale(10),
  },
  searchContainer: {
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  searchInput: {
    backgroundColor: colors.grey50,
    borderColor: colors.grey200,
    borderWidth: 1,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    fontSize: moderateScale(14),
    fontFamily: fonts.CabinetRegular,
  },
  scrollView: {
    flex: 1,
  },
  countryList: {
    paddingBottom: moderateScale(20),
  },
  countrySectionLabel: {
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(8),
    fontFamily: fonts.CabinetMedium,
  },
  countryItem: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    backgroundColor: colors.grey50,
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  countryItemSelected: {
    backgroundColor: '#F8F0FC',
    borderColor: colors.primary,
  },
  countryText: {
    fontFamily: fonts.CabinetRegular,
  },
  stateList: {
    paddingBottom: moderateScale(20),
  },
  stateItem: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    backgroundColor: colors.grey50,
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  stateText: {
    fontFamily: fonts.CabinetRegular,
  },
  cityList: {
    paddingBottom: moderateScale(20),
  },
  cityItem: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    backgroundColor: colors.grey50,
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  cityText: {
    fontFamily: fonts.CabinetRegular,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: moderateScale(20),
    fontFamily: fonts.CabinetRegular,
  },
  errorText: {
    marginTop: moderateScale(8),
    marginLeft: moderateScale(4),
    color: colors.error || '#EF4444',
    fontSize: moderateScale(14),
    fontFamily: fonts.CabinetMedium,
  },
});

export default ComponentThree;
