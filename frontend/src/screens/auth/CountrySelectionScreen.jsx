import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import {colors, fonts, fontSizes, moderateScale} from '../../theme';

const CountrySelectionScreen = ({navigation, route}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);

  // Get all countries data
  useEffect(() => {
    // This would typically come from your country data source
    // For now, we'll use a subset of common countries
    const commonCountries = [
      {cca2: 'US', name: 'United States', callingCode: ['1']},
      {cca2: 'PK', name: 'Pakistan', callingCode: ['92']},
      {cca2: 'IN', name: 'India', callingCode: ['91']},
      {cca2: 'GB', name: 'United Kingdom', callingCode: ['44']},
      {cca2: 'CA', name: 'Canada', callingCode: ['1']},
      {cca2: 'AU', name: 'Australia', callingCode: ['61']},
      {cca2: 'DE', name: 'Germany', callingCode: ['49']},
      {cca2: 'FR', name: 'France', callingCode: ['33']},
      {cca2: 'IT', name: 'Italy', callingCode: ['39']},
      {cca2: 'ES', name: 'Spain', callingCode: ['34']},
      {cca2: 'BR', name: 'Brazil', callingCode: ['55']},
      {cca2: 'MX', name: 'Mexico', callingCode: ['52']},
      {cca2: 'JP', name: 'Japan', callingCode: ['81']},
      {cca2: 'KR', name: 'South Korea', callingCode: ['82']},
      {cca2: 'CN', name: 'China', callingCode: ['86']},
      {cca2: 'RU', name: 'Russia', callingCode: ['7']},
      {cca2: 'SA', name: 'Saudi Arabia', callingCode: ['966']},
      {cca2: 'AE', name: 'United Arab Emirates', callingCode: ['971']},
      {cca2: 'EG', name: 'Egypt', callingCode: ['20']},
      {cca2: 'ZA', name: 'South Africa', callingCode: ['27']},
    ];
    setCountries(commonCountries);
    setFilteredCountries(commonCountries);
  }, []);

  // Filter countries based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCountries(countries);
    } else {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [searchQuery, countries]);

  const handleCountrySelect = country => {
    setSelectedCountry(country);
    // Navigate back with selected country
    if (route.params?.onCountrySelect) {
      route.params.onCountrySelect(country);
    }
    navigation.goBack();
  };

  const renderCountryItem = ({item}) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}>
      <View style={styles.countryItemContent}>
        <View style={styles.flagContainer}>
          <CountryPicker
            countryCode={item.cca2}
            withEmoji
            withFlag
            withCountryNameButton={false}
            withCallingCodeButton={false}
            withAlphaFilter={false}
            withFilter={false}
            containerButtonStyle={styles.flagButton}
          />
        </View>
        <View style={styles.countryInfo}>
          <Text style={styles.countryName}>{item.name}</Text>
          <Text style={styles.callingCode}>+{item.callingCode[0]}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Select Country</Text>
        <Text style={styles.subtitle}>Pick your country to connect locally.</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Find your country..."
          placeholderTextColor={colors.grey400}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
        />
      </View>

      {/* Countries List */}
      <FlatList
        data={filteredCountries}
        renderItem={renderCountryItem}
        keyExtractor={item => item.cca2}
        style={styles.countriesList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(16),
  },
  title: {
    fontSize: fontSizes.XXL,
    fontFamily: fonts.CabinetBold,
    color: colors.grey800,
    marginBottom: moderateScale(4),
  },
  subtitle: {
    fontSize: fontSizes.M,
    fontFamily: fonts.CabinetRegular,
    color: colors.grey400,
  },
  searchContainer: {
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(16),
  },
  searchInput: {
    backgroundColor: colors.grey50,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    fontSize: fontSizes.M,
    fontFamily: fonts.CabinetRegular,
    color: colors.grey800,
    borderWidth: 1,
    borderColor: colors.grey100,
  },
  countriesList: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  countryItem: {
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  countryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagContainer: {
    marginRight: moderateScale(12),
  },
  flagButton: {
    padding: 0,
    margin: 0,
  },
  countryInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryName: {
    fontSize: fontSizes.M,
    fontFamily: fonts.CabinetMedium,
    color: colors.grey800,
    flex: 1,
  },
  callingCode: {
    fontSize: fontSizes.M,
    fontFamily: fonts.CabinetMedium,
    color: colors.grey400,
  },
});

export default CountrySelectionScreen;
