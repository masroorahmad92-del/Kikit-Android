import {Dimensions, Platform} from 'react-native';
export const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
  Dimensions.get('window');
export const isIOS = Platform.OS === 'ios';
//Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

const scale = size => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = size => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;
const moderateVerticalScale = (size, factor = 0.5) =>
  size + (verticalScale(size) - size) * factor;

export {scale, verticalScale, moderateScale, moderateVerticalScale};

export const fontSizes = {
  XXS: moderateScale(isIOS ? 10 : 10),
  XS: moderateScale(isIOS ? 12 : 12),
  S: moderateScale(isIOS ? 14 : 14),
  M: moderateScale(isIOS ? 16 : 16),
  L: moderateScale(isIOS ? 18 : 18),
  XL: moderateScale(isIOS ? 20 : 20),
  XXL: moderateScale(isIOS ? 22 : 22),
  XXXL: moderateScale(isIOS ? 32 : 32),
};
