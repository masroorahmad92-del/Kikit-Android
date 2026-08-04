import React, {useState, useRef, useEffect, useMemo} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import {Text} from './base/Text';
import {Input} from './base/Input';
import {FadeModal} from './base/FadeModal';
import {colors, moderateScale, fonts} from '../theme';
import {City, State, Country} from 'country-state-city';
import {ArrowDown} from '../assets/icons';
import Slider from '@react-native-community/slider';

// ====== TEXT INPUT MODAL ======
export const EditTextModal = ({
  visible,
  onClose,
  title,
  value,
  onSave,
  placeholder,
  multiline = false,
  maxLength,
  validation,
}) => {
  const [text, setText] = useState(value || '');
  const [error, setError] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setText(value || '');
      setError('');
      modalRef.current?.open();
    } else {
      modalRef.current?.close();
    }
  }, [visible, value]);

  const handleSave = () => {
    setError('');
    
    if (!text || text.trim().length === 0) {
      setError('This field cannot be empty');
      return;
    }

    if (validation) {
      const validationError = validation(text);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    onSave(text.trim());
    modalRef.current?.close();
  };

  return (
    <FadeModal
      refRBSheet={modalRef}
      onClose={onClose}
      header={true}
      headerTitle={title}
      setIsVisible={onClose}
      height={moderateScale(multiline ? 400 : 300)}
      isButtonAdded={true}
      dualButton={true}
      dualButton1Text="Cancel"
      dualButton2Text="Save"
      dualButton1Press={onClose}
      dualButton2Press={handleSave}>
      <View style={styles.modalContent}>
        <Input
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          type={multiline ? 'textarea' : 'input'}
          maxLength={maxLength}
          error={error}
          autoFocus={true}
        />
        {maxLength && (
          <Text fs="XS" color="grey400" style={styles.charCount}>
            {text.length}/{maxLength}
          </Text>
        )}
      </View>
    </FadeModal>
  );
};

// ====== SELECTION MODAL ======
export const EditSelectionModal = ({
  visible,
  onClose,
  title,
  value,
  options,
  onSave,
}) => {
  const [selected, setSelected] = useState(value || '');
  const modalRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setSelected(value || '');
      modalRef.current?.open();
    } else {
      modalRef.current?.close();
    }
  }, [visible, value]);

  const handleSave = () => {
    if (selected) {
      onSave(selected);
      modalRef.current?.close();
    }
  };

  const renderOption = ({item}) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        selected === item.value && styles.optionItemSelected,
      ]}
      onPress={() => setSelected(prev => prev === item.value ? '' : item.value)}
      activeOpacity={0.7}>
      <View style={styles.radioOuter}>
        {selected === item.value && <View style={styles.radioInner} />}
      </View>
      <Text
        ff="c-Regular"
        fs="M"
        color={selected === item.value ? 'grey800' : 'grey500'}
        style={styles.optionText}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <FadeModal
      refRBSheet={modalRef}
      onClose={onClose}
      header={true}
      headerTitle={title}
      setIsVisible={onClose}
      height={moderateScale(500)}
      isButtonAdded={true}
      dualButton={true}
      dualButton1Text="Cancel"
      dualButton2Text="Save"
      dualButton1Press={onClose}
      dualButton2Press={handleSave}
      dualButton2Disabled={!selected}>
      <FlatList
        data={options}
        renderItem={renderOption}
        keyExtractor={(item) => item.value}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.optionsList}
      />
    </FadeModal>
  );
};

// ====== MULTI-SELECTION MODAL ======
export const EditMultiSelectionModal = ({
  visible,
  onClose,
  title,
  values,
  options,
  onSave,
}) => {
  const [selected, setSelected] = useState([]);
  const modalRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setSelected(Array.isArray(values) ? [...values] : []);
      modalRef.current?.open();
    } else {
      modalRef.current?.close();
    }
  }, [visible, values]);

  const toggleOption = (val) => {
    setSelected(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val],
    );
  };

  const handleSave = () => {
    if (selected.length > 0) {
      onSave(selected);
      modalRef.current?.close();
    }
  };

  const renderOption = ({item}) => {
    const isSelected = selected.includes(item.value);
    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          isSelected && styles.optionItemSelected,
        ]}
        onPress={() => toggleOption(item.value)}
        activeOpacity={0.7}>
        <View style={styles.radioOuter}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
        <Text
          ff="c-Regular"
          fs="M"
          color={isSelected ? 'grey800' : 'grey500'}
          style={styles.optionText}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <FadeModal
      refRBSheet={modalRef}
      onClose={onClose}
      header={true}
      headerTitle={title}
      setIsVisible={onClose}
      height={moderateScale(500)}
      isButtonAdded={true}
      dualButton={true}
      dualButton1Text="Cancel"
      dualButton2Text="Save"
      dualButton1Press={onClose}
      dualButton2Press={handleSave}
      dualButton2Disabled={selected.length === 0}>
      <FlatList
        data={options}
        renderItem={renderOption}
        keyExtractor={(item) => item.value}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.optionsList}
      />
    </FadeModal>
  );
};

// ====== LOCATION MODAL ======
// Single full-screen bottom sheet with internal view switching to avoid
// nested-modal stacking issues with RBSheet.
const LOC_VIEW = { MAIN: 'main', COUNTRY: 'country', STATE: 'state', CITY: 'city' };

export const EditLocationModal = ({
  visible,
  onClose,
  country,
  state,
  city,
  onSave,
}) => {
  const allCountries = useMemo(() => Country.getAllCountries(), []);
  const [selectedCountryObj, setSelectedCountryObj] = useState(null);
  const [selectedStateObj, setSelectedStateObj] = useState(null);
  const [selectedCityName, setSelectedCityName] = useState(city || '');
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState(LOC_VIEW.MAIN);
  const modalRef = useRef(null);
  const pickerScrollRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setError('');
      setActiveView(LOC_VIEW.MAIN);
      setSearchQuery('');
      setSelectedCityName(city || '');

      const countryObj = country
        ? allCountries.find(c => c.name.toLowerCase() === country.toLowerCase())
        : null;
      setSelectedCountryObj(countryObj || null);

      if (countryObj) {
        const stateList = State.getStatesOfCountry(countryObj.isoCode);
        setAvailableStates(stateList);
        const stateObj = state
          ? stateList.find(s => s.name.toLowerCase() === state.toLowerCase())
          : null;
        setSelectedStateObj(stateObj || null);
        if (stateObj) {
          setAvailableCities(City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode));
        } else {
          setAvailableCities([]);
        }
      } else {
        setAvailableStates([]);
        setAvailableCities([]);
        setSelectedStateObj(null);
      }

      modalRef.current?.open();
    } else {
      modalRef.current?.close();
    }
  }, [visible, country, state, city, allCountries]);

  const openPicker = (view) => {
    setSearchQuery('');
    setActiveView(view);
    setTimeout(() => {
      pickerScrollRef.current?.scrollTo({y: 0, animated: false});
    }, 0);
  };

  const handleCountrySelect = (countryObj) => {
    setSelectedCountryObj(countryObj);
    setSelectedStateObj(null);
    setSelectedCityName('');
    const stateList = State.getStatesOfCountry(countryObj.isoCode);
    setAvailableStates(stateList);
    setAvailableCities([]);
    setActiveView(LOC_VIEW.MAIN);
    if (error) { setError(''); }
  };

  const handleStateSelect = (stateObj) => {
    setSelectedStateObj(stateObj);
    setSelectedCityName('');
    if (selectedCountryObj) {
      setAvailableCities(City.getCitiesOfState(selectedCountryObj.isoCode, stateObj.isoCode));
    }
    setActiveView(LOC_VIEW.MAIN);
    if (error) { setError(''); }
  };

  const handleCitySelect = (cityObj) => {
    setSelectedCityName(cityObj.name);
    setActiveView(LOC_VIEW.MAIN);
    if (error) { setError(''); }
  };

  const handleSave = () => {
    setError('');
    if (!selectedCountryObj || !selectedStateObj) {
      setError('Please select country and state');
      return;
    }
    onSave({
      country: selectedCountryObj.name.toLowerCase(),
      state: selectedStateObj.name.toLowerCase(),
      city: selectedCityName ? selectedCityName.toLowerCase() : null,
    });
    modalRef.current?.close();
  };

  const handleClose = () => {
    if (activeView !== LOC_VIEW.MAIN) {
      setActiveView(LOC_VIEW.MAIN);
      return;
    }
    onClose();
  };

  const q = searchQuery.trim().toLowerCase();

  const filteredCountries = useMemo(() => {
    if (!q) { return allCountries; }
    return allCountries.filter(c => c.name.toLowerCase().includes(q));
  }, [q, allCountries]);

  const filteredStates = useMemo(() => {
    if (!q) { return availableStates; }
    return availableStates.filter(s => s.name.toLowerCase().includes(q));
  }, [q, availableStates]);

  const filteredCities = useMemo(() => {
    if (!q) { return availableCities; }
    return availableCities.filter(c => c.name.toLowerCase().includes(q));
  }, [q, availableCities]);

  const capitalize = (str) => {
    if (!str) { return ''; }
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const headerTitle = activeView === LOC_VIEW.COUNTRY
    ? 'Select Country'
    : activeView === LOC_VIEW.STATE
      ? 'Select State'
      : activeView === LOC_VIEW.CITY
        ? 'Select City'
        : 'Edit Location';

  const showButtons = activeView === LOC_VIEW.MAIN;

  return (
    <FadeModal
      refRBSheet={modalRef}
      onClose={handleClose}
      header={true}
      headerTitle={headerTitle}
      setIsVisible={handleClose}
      height={moderateScale(700)}
      isButtonAdded={showButtons}
      dualButton={true}
      dualButton1Text="Cancel"
      dualButton2Text="Save"
      dualButton1Press={onClose}
      dualButton2Press={handleSave}>

      {/* ===== MAIN VIEW: Dropdowns ===== */}
      {activeView === LOC_VIEW.MAIN && (
        <View style={locStyles.content}>
          <TouchableOpacity
            onPress={() => openPicker(LOC_VIEW.COUNTRY)}
            style={locStyles.dropdown}>
            <View style={locStyles.dropdownContent}>
              <Text
                fs="M"
                color={selectedCountryObj ? 'grey800' : 'grey400'}
                style={locStyles.dropdownLabel}
                numberOfLines={1}>
                {selectedCountryObj ? capitalize(selectedCountryObj.name) : 'Select Country *'}
              </Text>
              <ArrowDown />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!selectedCountryObj) {
                setError('Please select a country first');
                return;
              }
              openPicker(LOC_VIEW.STATE);
            }}
            style={[locStyles.dropdown, !selectedCountryObj && locStyles.dropdownDisabled]}>
            <View style={locStyles.dropdownContent}>
              <Text
                fs="M"
                color={selectedStateObj ? 'grey800' : 'grey400'}
                style={locStyles.dropdownLabel}
                numberOfLines={1}>
                {selectedStateObj ? capitalize(selectedStateObj.name) : 'Select State *'}
              </Text>
              <ArrowDown />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!selectedStateObj) {
                setError('Please select a state first');
                return;
              }
              openPicker(LOC_VIEW.CITY);
            }}
            style={[locStyles.dropdown, !selectedStateObj && locStyles.dropdownDisabled]}>
            <View style={locStyles.dropdownContent}>
              <Text
                fs="M"
                color={selectedCityName ? 'grey800' : 'grey400'}
                style={locStyles.dropdownLabel}
                numberOfLines={1}>
                {selectedCityName ? capitalize(selectedCityName) : 'Select City (Optional)'}
              </Text>
              <ArrowDown />
            </View>
          </TouchableOpacity>

          {error ? (
            <Text fs="S" color="danger" style={locStyles.errorText}>
              {error}
            </Text>
          ) : null}
        </View>
      )}

      {/* ===== COUNTRY PICKER VIEW ===== */}
      {activeView === LOC_VIEW.COUNTRY && (
        <View style={locStyles.pickerContent}>
          <View style={locStyles.searchContainer}>
            <Input
              placeholder="Search country..."
              placeholderTextColor={colors.grey400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={locStyles.searchInput}
            />
          </View>
          <ScrollView ref={pickerScrollRef} showsVerticalScrollIndicator={false} style={locStyles.scrollView} keyboardShouldPersistTaps="handled">
            {filteredCountries.length > 0 ? (
              filteredCountries.map(c => (
                <TouchableOpacity
                  key={c.isoCode}
                  style={[
                    locStyles.pickerItem,
                    selectedCountryObj?.isoCode === c.isoCode && locStyles.pickerItemSelected,
                  ]}
                  onPress={() => handleCountrySelect(c)}>
                  <Text
                    fs="M"
                    color={selectedCountryObj?.isoCode === c.isoCode ? 'primary' : 'grey800'}
                    style={locStyles.pickerText}>
                    {c.flag} {c.name}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text fs="M" color="grey400" style={locStyles.emptyText}>
                No countries found
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* ===== STATE PICKER VIEW ===== */}
      {activeView === LOC_VIEW.STATE && (
        <View style={locStyles.pickerContent}>
          <View style={locStyles.searchContainer}>
            <Input
              placeholder="Search state..."
              placeholderTextColor={colors.grey400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={locStyles.searchInput}
            />
          </View>
          <ScrollView ref={pickerScrollRef} showsVerticalScrollIndicator={false} style={locStyles.scrollView} keyboardShouldPersistTaps="handled">
            {filteredStates.length > 0 ? (
              filteredStates.map((s, idx) => (
                <TouchableOpacity
                  key={s.isoCode || idx}
                  style={[
                    locStyles.pickerItem,
                    selectedStateObj?.isoCode === s.isoCode && locStyles.pickerItemSelected,
                  ]}
                  onPress={() => handleStateSelect(s)}>
                  <Text
                    fs="M"
                    color={selectedStateObj?.isoCode === s.isoCode ? 'primary' : 'grey800'}
                    style={locStyles.pickerText}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text fs="M" color="grey400" style={locStyles.emptyText}>
                {searchQuery ? 'No states found' : 'No states available'}
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* ===== CITY PICKER VIEW ===== */}
      {activeView === LOC_VIEW.CITY && (
        <View style={locStyles.pickerContent}>
          <View style={locStyles.searchContainer}>
            <Input
              placeholder="Search city..."
              placeholderTextColor={colors.grey400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={locStyles.searchInput}
            />
          </View>
          <ScrollView ref={pickerScrollRef} showsVerticalScrollIndicator={false} style={locStyles.scrollView} keyboardShouldPersistTaps="handled">
            {filteredCities.length > 0 ? (
              filteredCities.map((c, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={locStyles.pickerItem}
                  onPress={() => handleCitySelect(c)}>
                  <Text fs="M" color="grey800" style={locStyles.pickerText}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text fs="M" color="grey400" style={locStyles.emptyText}>
                {searchQuery ? 'No cities found' : 'No cities available'}
              </Text>
            )}
          </ScrollView>
        </View>
      )}
    </FadeModal>
  );
};

const locStyles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: moderateScale(10),
    gap: moderateScale(16),
  },
  dropdown: {
    borderColor: colors.grey100,
    borderWidth: 1,
    borderRadius: moderateScale(50),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
  },
  dropdownDisabled: {
    opacity: 0.5,
  },
  dropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownLabel: {
    flex: 1,
    fontFamily: fonts.CabinetRegular,
  },
  pickerContent: {
    flex: 1,
  },
  searchContainer: {
    marginBottom: moderateScale(12),
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
  pickerItem: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    backgroundColor: colors.grey50,
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerItemSelected: {
    backgroundColor: '#F8F0FC',
    borderColor: colors.primary,
  },
  pickerText: {
    fontFamily: fonts.CabinetRegular,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: moderateScale(20),
    fontFamily: fonts.CabinetRegular,
  },
  errorText: {
    marginTop: moderateScale(4),
    textAlign: 'center',
  },
});

// ====== HEIGHT MODAL ======
export const EditHeightModal = ({visible, onClose, value, onSave}) => {
  const [height, setHeight] = useState(140);
  const modalRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Extract height from string like "140 cm (4'7")"
      if (value) {
        const match = value.match(/\d+/);
        if (match) {
          setHeight(parseInt(match[0], 10));
        }
      }
      modalRef.current?.open();
    } else {
      modalRef.current?.close();
    }
  }, [visible, value]);

  const cmToFeet = (cm) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  };

  const handleSave = () => {
    const heightString = `${height} cm (${cmToFeet(height)})`;
    onSave(heightString);
    modalRef.current?.close();
  };

  return (
    <FadeModal
      refRBSheet={modalRef}
      onClose={onClose}
      header={true}
      headerTitle="Select Height"
      setIsVisible={onClose}
      height={moderateScale(400)}
      isButtonAdded={true}
      dualButton={true}
      dualButton1Text="Cancel"
      dualButton2Text="Save"
      dualButton1Press={onClose}
      dualButton2Press={handleSave}>
      <View style={styles.heightContainer}>
        <Text ff="c-Medium" fs="XXL" color="grey800" style={styles.heightDisplay}>
          {height} cm ({cmToFeet(height)})
        </Text>
        <View style={styles.sliderContainer}>
          <View style={styles.sliderLabels}>
            <Text ff="c-Regular" fs="S" color="grey500">
              120 cm
            </Text>
            <Text ff="c-Regular" fs="S" color="grey500">
              220 cm
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={120}
            maximumValue={220}
            step={1}
            value={height}
            onValueChange={(value) => setHeight(Math.round(value))}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.grey200}
            thumbTintColor={colors.primary}
          />
          <View style={styles.heightMarkers}>
            {[140, 160, 180, 200].map((marker) => (
              <View key={marker} style={styles.markerContainer}>
                <View style={styles.markerLine} />
                <Text ff="c-Regular" fs="XS" color="grey400">
                  {marker}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </FadeModal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    paddingTop: moderateScale(10),
  },
  charCount: {
    textAlign: 'right',
    marginTop: moderateScale(8),
  },
  optionsList: {
    paddingBottom: moderateScale(20),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(8),
    backgroundColor: colors.grey50,
  },
  optionItemSelected: {
    backgroundColor: colors.selectedItembgCOlor,
  },
  radioOuter: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  radioInner: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
  },
  errorText: {
    marginTop: moderateScale(10),
    textAlign: 'center',
  },
  heightContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: moderateScale(20),
  },
  heightDisplay: {
    marginBottom: moderateScale(40),
    fontWeight: '700',
  },
  sliderContainer: {
    width: '100%',
    paddingHorizontal: moderateScale(10),
  },
  slider: {
    width: '100%',
    height: moderateScale(40),
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(10),
  },
  heightMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: moderateScale(10),
    paddingHorizontal: moderateScale(20),
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerLine: {
    width: 1,
    height: moderateScale(8),
    backgroundColor: colors.grey300,
    marginBottom: moderateScale(4),
  },
});

