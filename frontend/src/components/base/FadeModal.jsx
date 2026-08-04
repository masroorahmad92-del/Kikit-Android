// FadeModal.js

import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import {
  Colors,
  FontSizes,
  Fonts,
  
  colors,
  
  fontSizes,
  
  fonts,
  
  moderateScale,
  scale,
  verticalScale,
} from '../../theme';
import {Button} from './Button';
import {Text} from './Text';
import { CloseIcon } from '../../assets/icons';

export const FadeModal = ({
  onClose,
  header,
  headerTitle,
  setIsVisible,
  height,
  children,
  closeOnDragDown = true,
  closeOnPressMask = true,
  openDuration = 300,
  dualButton = false,
  dualButton1Text,
  dualButton2Text,
  dualButton1Press = setIsVisible,
  dualButton2Press,
  dualButton1Disabled = false,
  dualButton1Loading = false,
  dualButton2Disabled = false,
  dualButton2Loading = false,
  isButtonAdded = false,
  simpleBtnTitle = 'Close',
  loading,
  type = 1,
  icon = <CloseIcon />,
  btnType = 'disabled',
  headerStyle = {},
  viewStyle = {},
  subTitleStyle = {},
  refRBSheet,
  subTitle,
}) => {
  return (
    <RBSheet
      ref={refRBSheet}
      onClose={onClose}
      height={height}
      customStyles={styles.rBSheetStyle}
      draggable={closeOnDragDown}
      closeOnPressMask={closeOnPressMask}
      customModalProps={{animationType: 'fade'}}
      openDuration={openDuration}
      snapPoints={[0, '25%', '50%', '75%', '100%']}
      initialSnapIndex={0}
      enableDragHandling={true}>
      <View style={[styles.modalContainer, viewStyle]}>
        {header && (
          <>
            {type == 1 ? (
              <View style={styles.headerContainer}>
                <Text
                  style={[headerStyle, {flex: 1}]}
                  ff="semiBold"
                  color="blue70"
                  fs={'L'}>
                  {headerTitle}
                  {subTitle && (
                    <Text style={subTitleStyle} fs="XS" ff="medium">
                      {subTitle}
                    </Text>
                  )}
                </Text>
                <TouchableOpacity onPress={setIsVisible} activeOpacity={0.7}>
                  <CloseIcon/>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{alignItems: 'center', gap: moderateScale(20)}}>
                {icon}
                <Text
                  ff="semiBold"
                  color="blue70"
                  fs={'M'}
                  style={{textAlign: 'center', lineHeight: moderateScale(20)}}>
                  {headerTitle}
                </Text>
              </View>
            )}
          </>
        )}
        <View style={styles.contentContainer}>{children}</View>
        {isButtonAdded && (
          <>
            {dualButton ? (
              <View style={[styles.buttonContainer, styles.commonBtnStyle]}>
                <View style={{flex: 1}}>
                  <Button
                    type={dualButton1Disabled ? 'disabled' : 'outlined'}
                    loading={dualButton1Loading}
                    title={dualButton1Text}
                    onPress={dualButton1Press}
                    buttonStyle={{width: '100%',borderColor:colors.grey50}}
                  />
                </View>

                <View style={{flex: 1}}>
                  <Button
                    loading={dualButton2Loading || loading}
                    title={dualButton2Text}
                    onPress={dualButton2Press}
                    buttonStyle={{width: '100%'}}
                    type={dualButton2Disabled ? 'disabled' : 'default'}
                  />
                </View>
              </View>
            ) : (
              <>
                {isButtonAdded && (
                  <View style={[styles.buttonContainer, styles.commonBtnStyle]}>
                    <View style={{flex: 1}}>
                      <Button
                        loading={loading}
                        title={simpleBtnTitle}
                        onPress={dualButton1Press}
                        buttonStyle={styles.commonBtnStyle}
                        type={btnType}
                      />
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </View>
    </RBSheet>
  );
};

const styles = StyleSheet.create({
  rBSheetStyle: {
    wrapper: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    container: {
      borderTopLeftRadius: moderateScale(16),
      borderTopRightRadius: moderateScale(16),
      backgroundColor: colors.white,
    },
    draggableIcon: {
      backgroundColor: '#CDCDCD',
      width: scale(100),
    },
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
  },
  headerContainer: {
    marginBottom: moderateScale(7),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    marginBottom: moderateScale(5),
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    gap: 20,
  },

  commonBtnStyle: {
    marginBottom: moderateScale(5),
  },

  borderView: {
    borderBottomWidth: 1,
    borderBottomColor: '#212121',
    marginBottom: moderateScale(10),
  },
  buttonStyle: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',

    // height: verticalScale(48),
    // borderRadius: moderateScale(25),
    // marginVertical: moderateScale(8)
  },
  buttonGradient: {
    flex: 1,
    borderRadius: moderateScale(25),
    justifyContent: 'center',
    alignItems: 'center',
    height: verticalScale(48),
    paddingHorizontal: moderateScale(40),
    marginVertical: moderateScale(8),
  },
  textStyle: {
    fontFamily: fonts.CabinetBold,
    color: colors.black,
    fontSize: fontSizes.M,
  },
});
