import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import {colors, fonts, fontSizes, moderateScale} from '../theme';
import { ArrowDown } from '../assets/icons';

// Helper function to get default country data
const getDefaultCountryData = (countryCode) => {
  const countryData = {
    US: { cca2: 'US', callingCode: ['1'], name: 'United States' },
    GB: { cca2: 'GB', callingCode: ['44'], name: 'United Kingdom' },
    IN: { cca2: 'IN', callingCode: ['91'], name: 'India' },
    CA: { cca2: 'CA', callingCode: ['1'], name: 'Canada' },
    AU: { cca2: 'AU', callingCode: ['61'], name: 'Australia' },
    // Add more as needed
  };
  return countryData[countryCode] || countryData['US'];
};

const CustomCountryPhonePicker = ({
  value = '',
  onChangePhoneNumber,
  defaultCountry = 'US',
}) => {
  const [countryCode, setCountryCode] = useState(defaultCountry);
  // Initialize country with default values
  const [country, setCountry] = useState(getDefaultCountryData(defaultCountry));
  const [phoneNumber, setPhoneNumber] = useState(value);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const onSelectCountry = selectedCountry => {
    setCountry(selectedCountry);
    setCountryCode(selectedCountry.cca2);
    if (onChangePhoneNumber) {
      onChangePhoneNumber(phoneNumber, selectedCountry);
    }
  };

  const handlePhoneChange = text => {
    setPhoneNumber(text);
    if (onChangePhoneNumber) {
      onChangePhoneNumber(text, country);
    }
  };

  // Get display values
  const displayCountry = country?.name || 'United States';
  const displayCallingCode = country?.callingCode?.[0] || '1';
  const displayCountryCode = country?.cca2 || countryCode;

  return (
    <View style={styles.container}>
      {/* Custom Country Selector Button - Matches your design */}
      <TouchableOpacity
        style={styles.countryButton}
        onPress={() => setIsPickerVisible(true)}>
        <View style={styles.countryContent}>
          {/* Render flag using CountryPicker component */}
          <View style={styles.flagContainer}>
            <CountryPicker
              countryCode={displayCountryCode}
              withEmoji
              withFlag
              withCountryNameButton={false}
              withCallingCodeButton={false}
              withAlphaFilter={false}
              withFilter={false}
              containerButtonStyle={styles.flagButton}
            />
          </View>
          <Text style={styles.countryText}>
            {displayCountry} (+{displayCallingCode})
          </Text>
        </View>
        <ArrowDown/>
      </TouchableOpacity>

      {/* Phone Number Input */}
      <View style={styles.phoneInputContainer}>
        <View style={styles.callingCodeBox}>
          <Text style={styles.callingCode}>+{displayCallingCode}</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          placeholder="(XXX) XXX-XXXX"
          placeholderTextColor="#999"
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
        />
      </View>

      {/* Modal Picker */}
      <CountryPicker
        countryCode={countryCode}
        withFilter
        withFlag
        withCountryNameButton={false}
        withCallingCode
        withEmoji
        onSelect={onSelectCountry}
        visible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
        // Modal customization
        containerButtonStyle={styles.hiddenPicker}
        modalProps={{
          animationType: 'slide',
        }}
        // Theme customization to match your design
        theme={{
          fontFamily: fonts.CabinetBold,
          fontSize: fontSizes.L,
          primaryColor: '#2196F3',
          primaryColorVariant: '#1976D2',
          backgroundColor: '#FFFFFF',
          onBackgroundTextColor: '#000000',
          filterPlaceholderTextColor: '#999999',
        }}
        translation="eng"
        placeholder="Find your country..."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // padding: 20,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // backgroundColor: colors.gradientBG,
    borderWidth: 2,
    borderColor: colors.grey100,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    minHeight: moderateScale(60),
    height:moderateScale(60),
    borderRadius: moderateScale(35),
  },
  countryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagContainer: {
    marginRight: 8,
  },
  flagButton: {
    padding: 0,
    margin: 0,
  },
  countryText: {
    fontSize: 16,
    color: colors.grey800,
    fontFamily: fonts.CabinetMedium,
  },
  chevron: {
    fontSize: 28,
    color: colors.grey800,
    fontWeight: '300',
    transform: [{rotate: '90deg'}],
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.grey100,
    borderRadius: moderateScale(35),

    paddingHorizontal: moderateScale(16),
    minHeight: moderateScale(60),

    // backgroundColor: colors.gradientBackground,
  },
  callingCodeBox: {
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: colors.grey800,
    marginRight: 12,

  },
  callingCode: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.grey800,
    fontFamily: fonts.CabinetMedium,

  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: colors.grey800,
    fontFamily: fonts.CabinetMedium,
  },
  hiddenPicker: {
    width: 0,
    height: 0,
    opacity: 0,
  },
});

export default CustomCountryPhonePicker;
