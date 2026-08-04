import React from 'react';
import {View, TextInput, StyleSheet} from 'react-native';
import {colors, fonts, moderateScale} from '../theme';

const SearchBar = ({
  placeholder = 'Search profiles',
  value,
  onChangeText,
  containerStyle,
  inputStyle,
  icon,
  ...rest
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={colors.grey400}
        value={value}
        onChangeText={onChangeText}
        selectionColor={colors.primary}
        {...rest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: moderateScale(25),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    marginRight: moderateScale(10),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(16),
    fontFamily: fonts.CabinetRegular,
    color: colors.grey800,
  },
});

export default SearchBar;

