import React, {useMemo, useRef, useState, useEffect, useImperativeHandle, forwardRef} from 'react';
import {View, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Collapsible from 'react-native-collapsible';
import Toast from 'react-native-toast-message';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import {Country} from 'country-state-city';
import {Text} from './base/Text';
import {Input} from './base/Input';
import {FadeModal} from './base/FadeModal';
import {colors, fonts, moderateScale, verticalScale} from '../theme';
import {
  ArrowDown,
  ArrowUp,
  CloseIcon,
  Sports,
  Arts,
  Music,
  Travel,
} from '../assets/icons';
import {preferencesService} from '../api/services/preferencesService';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

const Chip = ({label, selected, onPress}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}>
      <Text fs={'M'} ff={'semiBold'} color={'grey800'}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const Row = ({icon, title, expanded, onToggle, children}) => {
  return (
    <View style={styles.rowWrapper}>
      <TouchableOpacity activeOpacity={0.8} style={styles.rowHeader} onPress={onToggle}>
        <View style={styles.rowLeft}>
          {icon}
          <Text fs={'L'} ff={'semiBold'} color={'grey800'} style={{marginLeft: moderateScale(12)}}>
            {title}
          </Text>
        </View>
        {expanded ? <ArrowUp /> : <ArrowDown />}
      </TouchableOpacity>
      {expanded ? (
        <View style={styles.rowBody}>{children}</View>
      ) : (
        <Collapsible collapsed={true}>
          <View style={styles.rowBody}>{children}</View>
        </Collapsible>
      )}
    </View>
  );
};

const FilterSheet = forwardRef(({onSave, onReset, onValidityChange}, ref) => {
  const [lookingFor, setLookingFor] = useState([]);
  const [ageRange, setAgeRange] = useState([18, 30]);
  const [ethnicity, setEthnicity] = useState([]);

  // Country multi-select
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const countryModalRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // API data
  const [interestsData, setInterestsData] = useState([]);
  const [hobbiesData, setHobbiesData] = useState([]);

  // Selected items (storing UUIDs)
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedHobbies, setSelectedHobbies] = useState([]);

  // Expansion states for categories
  const [expandedCategories, setExpandedCategories] = useState({});

  const allCountries = useMemo(() => Country.getAllCountries(), []);
  const filteredCountries = useMemo(() => {
    const q = countrySearchQuery.trim().toLowerCase();
    const base = q
      ? allCountries.filter(c => c.name.toLowerCase().includes(q))
      : allCountries;
    if (q || selectedCountries.length === 0) {
      return base;
    }
    const pinned = selectedCountries
      .map(iso => allCountries.find(c => c.isoCode === String(iso).toUpperCase()))
      .filter(Boolean);
    const pinnedCodes = new Set(pinned.map(c => c.isoCode));
    const rest = base.filter(c => !pinnedCodes.has(c.isoCode));
    return [...pinned, ...rest];
  }, [allCountries, countrySearchQuery, selectedCountries]);

  // Icon mapping function based on category name
  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('sport') || name.includes('fitness') || name.includes('gym')) {
      return <Sports />;
    } else if (name.includes('music') || name.includes('performance') || name.includes('singing')) {
      return <Music />;
    } else if (name.includes('travel') || name.includes('adventure') || name.includes('outdoor')) {
      return <Travel />;
    } else if (name.includes('art') || name.includes('craft') || name.includes('creative')) {
      return <Arts />;
    } else if (name.includes('tech') || name.includes('gaming') || name.includes('game')) {
      return <Travel />;
    } else {
      return <Sports />;
    }
  };

  // Load interests, hobbies, and user preferences
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [interestsRes, hobbiesRes, prefsRes] = await Promise.all([
        preferencesService.getInterests(),
        preferencesService.getHobbies(),
        preferencesService.getPreferences().catch(() => null),
      ]);

      console.log('Interests API Response:', interestsRes.data);
      console.log('Hobbies API Response:', hobbiesRes.data);

      setInterestsData(interestsRes.data || []);
      setHobbiesData(hobbiesRes.data || []);

      // Load user preferences if they exist
      // API shape: { status, url, data: { looking_for, country, ... } } or flat { looking_for, ... }
      const prefsRaw = prefsRes?.data;
      const prefs =
        prefsRaw && typeof prefsRaw === 'object' && prefsRaw.data !== undefined
          ? prefsRaw.data
          : prefsRaw;

      if (prefs && typeof prefs === 'object') {
        console.log('User Preferences:', prefs);

        if (prefs.looking_for) {
          setLookingFor(
            Array.isArray(prefs.looking_for)
              ? prefs.looking_for
              : [prefs.looking_for],
          );
        }
        if (prefs.min_age != null && prefs.max_age != null) {
          setAgeRange([prefs.min_age, prefs.max_age]);
        }
        if (prefs.ethnicity) {
          setEthnicity(
            Array.isArray(prefs.ethnicity)
              ? prefs.ethnicity
              : [prefs.ethnicity],
          );
        }
        const countryCodes = prefs.country ?? prefs.countries;
        if (Array.isArray(countryCodes) && countryCodes.length > 0) {
          setSelectedCountries(
            countryCodes.map(c => String(c).toUpperCase()).filter(Boolean),
          );
        }
        if (prefs.interests) {
          setSelectedInterests(
            prefs.interests.map(i => (typeof i === 'object' ? i.id : i)).filter(Boolean),
          );
        }
        if (prefs.hobbies) {
          setSelectedHobbies(
            prefs.hobbies.map(h => (typeof h === 'object' ? h.id : h)).filter(Boolean),
          );
        }
      }
    } catch (error) {
      console.error('Error loading filter data:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (isoCode) => {
    setSelectedCountries(prev =>
      prev.includes(isoCode)
        ? prev.filter(c => c !== isoCode)
        : [...prev, isoCode],
    );
  };

  const toggleInterest = (interestId) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const toggleHobby = (hobbyId) => {
    setSelectedHobbies(prev =>
      prev.includes(hobbyId)
        ? prev.filter(id => id !== hobbyId)
        : [...prev, hobbyId]
    );
  };

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {};

      if (ageRange[0] !== 18 || ageRange[1] !== 30) {
        payload.min_age = ageRange[0];
        payload.max_age = ageRange[1];
      }
      if (selectedInterests.length > 0) {
        payload.interests = selectedInterests;
      }
      if (selectedHobbies.length > 0) {
        payload.hobbies = selectedHobbies;
      }
      if (lookingFor.length > 0) {
        payload.looking_for = lookingFor;
      }
      if (ethnicity.length > 0) {
        payload.ethnicity = ethnicity;
      }
      if (selectedCountries.length > 0) {
        payload.country = selectedCountries;
      }

      await preferencesService.updatePreferences(payload);

      Toast.show({
        type: 'success',
        text2: 'Success!',
        text1: 'Your preferences have been saved successfully',
        position: 'top',
        visibilityTime: 3000,
      });

      console.log('Preferences saved successfully');
      onSave?.();
      return true;
    } catch (error) {
      console.error('Error saving preferences:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save preferences. Please try again.',
        position: 'top',
        visibilityTime: 3000,
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLookingFor([]);
    setAgeRange([18, 30]);
    setEthnicity([]);
    setSelectedCountries([]);
    setSelectedInterests([]);
    setSelectedHobbies([]);
    onReset?.();
    onValidityChange?.(false);
  };

  // Validation logic — at least one filter value must be set
  const isFormValid = useMemo(() => {
    if (ageRange[0] >= ageRange[1]) {
      return false;
    }
    return (
      ageRange[0] !== 18 ||
      ageRange[1] !== 30 ||
      lookingFor.length > 0 ||
      ethnicity.length > 0 ||
      selectedCountries.length > 0 ||
      selectedInterests.length > 0 ||
      selectedHobbies.length > 0
    );
  }, [ageRange, lookingFor, ethnicity, selectedCountries, selectedInterests, selectedHobbies]);

  useEffect(() => {
    onValidityChange?.(isFormValid);
  }, [isFormValid, onValidityChange]);

  // Expose methods and validation state to parent via ref
  useImperativeHandle(ref, () => ({
    save: handleSave,
    reset: handleReset,
    isValid: isFormValid,
    isSaving: saving,
  }));

  const ethnicityOptions = useMemo(
    () => [
      {label: 'Asian', value: 'asian'},
      {label: 'Pakistani', value: 'pakistani'},
      {label: 'Latin', value: 'latin'},
      {label: 'European', value: 'european'},
      {label: 'South Asian', value: 'south_asian'},
      {label: 'Middle Eastern', value: 'middle_eastern'},
      {label: 'White Caucasian', value: 'white_caucasian'},
      {label: 'Hispanic Latino', value: 'hispanic_latino'},
      {label: 'Mixed Race', value: 'mixed_race'},
      {label: 'Other', value: 'other'},
    ],
    [],
  );

  if (loading) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        {/* Country Shimmer */}
        <View style={styles.shimmerSection}>
          <ShimmerPlaceholder
            style={styles.shimmerTitle}
            shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          />
          <ShimmerPlaceholder
            style={styles.shimmerBox}
            shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          />
        </View>

        {/* Looking for Shimmer */}
        <View style={styles.shimmerSection}>
          <ShimmerPlaceholder
            style={styles.shimmerTitle}
            shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          />
          <View style={styles.shimmerChipsRow}>
            <ShimmerPlaceholder
              style={styles.shimmerChip}
              shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
            />
            <ShimmerPlaceholder
              style={styles.shimmerChip}
              shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
            />
            <ShimmerPlaceholder
              style={styles.shimmerChip}
              shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
            />
          </View>
        </View>

        {/* Age Range Shimmer */}
        <View style={styles.shimmerSection}>
          <ShimmerPlaceholder
            style={styles.shimmerTitle}
            shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          />
          <View style={styles.shimmerBox}>
            <ShimmerPlaceholder
              style={styles.shimmerSlider}
              shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
            />
          </View>
        </View>

        {/* Ethnicity Shimmer */}
        <View style={styles.shimmerSection}>
          <ShimmerPlaceholder
            style={styles.shimmerTitle}
            shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          />
          <View style={styles.shimmerChipsRow}>
            <ShimmerPlaceholder
              style={styles.shimmerChip}
              shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
            />
            <ShimmerPlaceholder
              style={styles.shimmerChip}
              shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
            />
            <ShimmerPlaceholder
              style={styles.shimmerChip}
              shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
            />
            <ShimmerPlaceholder
              style={styles.shimmerChip}
              shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
            />
          </View>
        </View>

        {/* Interests Shimmer */}
        <View style={styles.shimmerSection}>
          <ShimmerPlaceholder
            style={styles.shimmerTitle}
            shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          />
          <ShimmerPlaceholder
            style={styles.shimmerRow}
            shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          />
          <ShimmerPlaceholder
            style={styles.shimmerRow}
            shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          />
        </View>

        {/* Hobbies Shimmer */}
        <View style={styles.shimmerSection}>
          <ShimmerPlaceholder
            style={styles.shimmerTitle}
            shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          />
          <ShimmerPlaceholder
            style={styles.shimmerRow}
            shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          />
          <ShimmerPlaceholder
            style={styles.shimmerRow}
            shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      {/* Country */}
      <Text fs={'XL'} ff={'semiBold'} color={'grey800'} style={styles.sectionTitleFirst}>
        Country
      </Text>

      {/* Selected country tags */}
      {selectedCountries.length > 0 && (
        <View style={styles.selectedCountriesRow}>
          {selectedCountries.slice(0, 3).map(isoCode => {
            const country = allCountries.find(c => c.isoCode === isoCode);
            return (
              <TouchableOpacity
                key={isoCode}
                activeOpacity={0.8}
                style={styles.selectedCountryTag}
                onPress={() => toggleCountry(isoCode)}>
                <Text fs={'S'} ff={'semiBold'} color={'primary'}>
                  {country ? `${country.flag} ${country.name}` : isoCode}
                </Text>
                <CloseIcon
                  width={moderateScale(12)}
                  height={moderateScale(12)}
                  fill={colors.primary}
                />
              </TouchableOpacity>
            );
          })}
          {selectedCountries.length > 3 && (
            <View style={styles.moreCountriesTag}>
              <Text fs={'S'} ff={'semiBold'} color={'primary'}>
                +{selectedCountries.length - 3} more
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Country picker trigger */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.countryPickerTrigger}
        onPress={() => {
          setCountrySearchQuery('');
          countryModalRef.current?.open();
        }}>
        <Text
          fs={'M'}
          ff={'medium'}
          color={selectedCountries.length > 0 ? 'grey800' : 'grey400'}>
          {selectedCountries.length > 0
            ? `${selectedCountries.length} countr${selectedCountries.length === 1 ? 'y' : 'ies'} selected`
            : 'Select countries...'}
        </Text>
        <ArrowDown />
      </TouchableOpacity>

      {/* Connect via */}
      <Text fs={'XL'} ff={'semiBold'} color={'grey800'} style={styles.sectionTitle}>
        Connect via
      </Text>
      <View style={styles.rowChips}>
        {[
          {label: 'Live rooms', value: 'dating'},
          {label: 'Friendship', value: 'friendship'},
          {label: 'Creator support', value: 'marriage'},
        ].map(opt => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={lookingFor.includes(opt.value)}
            onPress={() =>
              setLookingFor(prev =>
                prev.includes(opt.value)
                  ? prev.filter(v => v !== opt.value)
                  : [...prev, opt.value],
              )
            }
          />
        ))}
      </View>

      {/* Age Range */}
      <View style={styles.ageRangeHeader}>
        <Text fs={'XL'} ff={'semiBold'} color={'grey800'}>
          Age range
        </Text>
        <View style={styles.ageRangeBadge}>
          <Text fs={'M'} ff={'semiBold'} color={'primary'}>
            {ageRange[0]} - {ageRange[1]} years
          </Text>
        </View>
      </View>

      <View style={styles.ageRangeSliderContainer}>
        <MultiSlider
          values={ageRange}
          min={18}
          max={60}
          step={1}
          sliderLength={moderateScale(300)}
          onValuesChange={setAgeRange}
          selectedStyle={{backgroundColor: colors.primary}}
          unselectedStyle={{backgroundColor: colors.grey200}}
          markerStyle={styles.sliderMarkerStyle}
          trackStyle={{height: moderateScale(4), borderRadius: moderateScale(2)}}
          containerStyle={styles.sliderContainerStyle}
        />

        {/* Age markers */}
        <View style={styles.ageMarkersContainer}>
          {[18, 25, 30, 35, 40, 45, 50, 55, 60].map((age) => (
            <View key={age} style={styles.ageMarker}>
              <View style={styles.ageMarkerDot} />
              <Text fs={'XS'} ff={'medium'} color={'grey400'} style={styles.ageMarkerText}>
                {age}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Ethnicity */}
      <Text fs={'XL'} ff={'semiBold'} color={'grey800'} style={styles.sectionTitle}>
        Ethnicity
      </Text>
      <View style={styles.rowChips}>
        {ethnicityOptions.map(opt => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={ethnicity.includes(opt.value)}
            onPress={() =>
              setEthnicity(prev =>
                prev.includes(opt.value)
                  ? prev.filter(v => v !== opt.value)
                  : [...prev, opt.value],
              )
            }
          />
        ))}
      </View>

      {/* Interests */}
      <Text fs={'XL'} ff={'semiBold'} color={'grey800'} style={styles.sectionTitle}>
        Interests
      </Text>
      {interestsData.length > 0 ? (
        interestsData.map((category, idx) => (
          <Row
            key={category.id || idx}
            title={category.name}
            icon={getCategoryIcon(category.name)}
            expanded={expandedCategories[category.name]}
            onToggle={() => toggleCategory(category.name)}>
            <View style={styles.inlineChips}>
              {(category.interests || []).map(interest => (
                <Chip
                  key={interest.id}
                  label={interest.name}
                  selected={selectedInterests.includes(interest.id)}
                  onPress={() => toggleInterest(interest.id)}
                />
              ))}
            </View>
          </Row>
        ))
      ) : (
        <Text fs={'M'} ff={'medium'} color={'grey400'} style={{marginTop: moderateScale(8)}}>
          No interests available
        </Text>
      )}

      {/* Hobbies */}
      <Text fs={'XL'} ff={'semiBold'} color={'grey800'} style={styles.sectionTitle}>
        Hobbies
      </Text>
      {hobbiesData.length > 0 ? (
        hobbiesData.map((category, idx) => (
          <Row
            key={category.id || idx}
            title={category.name}
            icon={getCategoryIcon(category.name)}
            expanded={expandedCategories[category.name]}
            onToggle={() => toggleCategory(category.name)}>
            <View style={styles.inlineChips}>
              {(category.hobbies || []).map(hobby => (
                <Chip
                  key={hobby.id}
                  label={hobby.name}
                  selected={selectedHobbies.includes(hobby.id)}
                  onPress={() => toggleHobby(hobby.id)}
                />
              ))}
            </View>
          </Row>
        ))
      ) : (
        <Text fs={'M'} ff={'medium'} color={'grey400'} style={{marginTop: moderateScale(8)}}>
          No hobbies available
        </Text>
      )}

      {/* Country selection modal */}
      <FadeModal
        refRBSheet={countryModalRef}
        height={moderateScale(680)}
        header={true}
        headerTitle="Select Countries"
        isButtonAdded={false}
        closeOnDragDown={true}
        closeOnPressMask={true}>
        <View style={styles.modalSearchContainer}>
          <Input
            placeholder="Search country..."
            placeholderTextColor={colors.grey400}
            value={countrySearchQuery}
            onChangeText={setCountrySearchQuery}
            style={styles.modalSearchInput}
          />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.countryListScroll}>
          {!countrySearchQuery.trim() && selectedCountries.length > 0 && (
            <Text fs={'S'} ff={'medium'} color={'grey400'} style={styles.countryModalSectionLabel}>
              Selected countries
            </Text>
          )}
          {filteredCountries.map(country => {
            const isSelected = selectedCountries.some(
              code => String(code).toUpperCase() === country.isoCode,
            );
            return (
              <TouchableOpacity
                key={country.isoCode}
                activeOpacity={0.8}
                style={[styles.countryListItem, isSelected && styles.countryListItemSelected]}
                onPress={() => toggleCountry(country.isoCode)}>
                <Text fs={'M'} ff={isSelected ? 'semiBold' : 'medium'} color={'grey800'}>
                  {country.flag}{'  '}{country.name}
                </Text>
                {isSelected && (
                  <View style={styles.countryCheckDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </FadeModal>
    </ScrollView>
  );
});

export default FilterSheet;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    paddingBottom: moderateScale(32),
  },
  shimmerSection: {
    marginTop: moderateScale(20),
  },
  shimmerTitle: {
    width: moderateScale(120),
    height: moderateScale(24),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  shimmerBox: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    paddingVertical: moderateScale(24),
    borderWidth: 1,
    borderColor: colors.grey200,
    height: moderateScale(70),
  },
  shimmerSlider: {
    width: '100%',
    height: moderateScale(40),
    borderRadius: moderateScale(8),
  },
  shimmerChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
  },
  shimmerChip: {
    width: moderateScale(100),
    height: moderateScale(40),
    borderRadius: moderateScale(14),
  },
  shimmerRow: {
    width: '100%',
    height: moderateScale(60),
    borderRadius: moderateScale(16),
    marginTop: moderateScale(12),
  },
  sectionTitleFirst: {
    marginTop: moderateScale(20),
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    marginTop: moderateScale(20),
    marginBottom: moderateScale(12),
  },
  selectedCountriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
    marginBottom: moderateScale(10),
  },
  selectedCountryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(12),
    backgroundColor: '#F5E8FF',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: moderateScale(20),
  },
  moreCountriesTag: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: moderateScale(12),
    backgroundColor: '#F5E8FF',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: moderateScale(20),
  },
  countryPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(14),
    paddingHorizontal: moderateScale(16),
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: moderateScale(14),
    backgroundColor: colors.white,
  },
  rowChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
  },
  chip: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(16),
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: moderateScale(14),
    backgroundColor: colors.white,
  },
  chipSelected: {
    backgroundColor: '#F5E8FF',
    borderColor: colors.primary,
  },
  ageRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(20),
    marginBottom: moderateScale(12),
  },
  ageRangeBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    backgroundColor: '#F5E8FF',
    borderRadius: moderateScale(12),
  },
  ageRangeSliderContainer: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    paddingVertical: moderateScale(24),
    borderWidth: 1,
    borderColor: colors.grey200,
  },
  ageMarkersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(8),
    paddingHorizontal: moderateScale(5),
  },
  ageMarker: {
    alignItems: 'center',
    gap: moderateScale(4),
  },
  ageMarkerDot: {
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: colors.grey300,
  },
  ageMarkerText: {
    fontSize: moderateScale(9),
  },
  rowWrapper: {
    borderWidth: 1,
    borderColor: colors.grey200,
    borderRadius: moderateScale(16),
    marginTop: moderateScale(12),
    backgroundColor: colors.white,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(14),
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBody: {
    paddingHorizontal: moderateScale(14),
    paddingBottom: verticalScale(12),
    gap: moderateScale(10),
  },
  inlineChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
  },
  sliderMarkerStyle: {
    backgroundColor: colors.primary,
    height: moderateScale(24),
    width: moderateScale(24),
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sliderContainerStyle: {
    height: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Country modal
  modalSearchContainer: {
    marginBottom: moderateScale(12),
  },
  modalSearchInput: {
    backgroundColor: colors.grey50,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    fontFamily: fonts.CabinetRegular,
    color: colors.grey800,
    borderWidth: 1,
    borderColor: colors.grey100,
  },
  countryModalSectionLabel: {
    paddingHorizontal: moderateScale(4),
    marginBottom: moderateScale(8),
  },
  countryListScroll: {
    flex: 1,
  },
  countryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  countryListItemSelected: {
    backgroundColor: '#F5E8FF',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(8),
  },
  countryCheckDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: colors.primary,
  },
});
