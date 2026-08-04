import React from 'react';
import {Text as _Text, StyleSheet} from 'react-native';
import {fontSizes, fonts, colors} from '../../theme';
export const Text = props => {
  let {style = {}, children, ff, fs, color, gradient, ...rest} = props;

  const getFontSize = key => {
    switch (key) {
      case 'XXS':
        return fontSizes.XXS;
      case 'XS':
        return fontSizes.XS;
      case 'S':
        return fontSizes.S;
      case 'M':
        return fontSizes.M;
      case 'L':
        return fontSizes.L;
      case 'XL':
        return fontSizes.XL;
      case 'XXL':
        return fontSizes.XXL;
      case 'XXXL':
        return fontSizes.XXXL;
      default:
        return fontSizes.XXXL;
    }
  };

  const getFontFamily = key => {
    switch (key) {
      case 'c-Regular': //700
        return fonts.CabinetRegular;
      case 'c-medium': //500
        return fonts.CabinetMedium;
      case 'i-regular': //500
        return fonts.InterRegular;
      case 'i-bold': //700
        return fonts.InterBold;
      case 'i-medium': //500
        return fonts.InterMedium;
      default: //400
        return fonts.CabinetBold;
    }
  };

  const getColor = key => {
    return colors[key] ?? colors.grey800;
  };

  ff = getFontFamily(ff);
  fs = getFontSize(fs);
  color = getColor(color);

  style = StyleSheet.flatten(style);
  style = {fontSize: fs, fontFamily: ff, color, ...style};

  return (
    <_Text style={style} {...rest}>
      {children}
    </_Text>
  );
};
