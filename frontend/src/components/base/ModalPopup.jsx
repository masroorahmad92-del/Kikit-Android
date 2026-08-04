import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  colors,
  moderateScale,
  scale,
  SCREEN_WIDTH,
  verticalScale,
} from '../../theme';
import {Button} from './Button';
import {Text} from './Text';

export const ModalPopup = ({
  title,
  subtitle,
  yesTitle = 'Logout',
  noTitle = 'Cancel',
  wrapperStyle,
  titleIcon,
  onYesPress,
  onNoPress,
  onBackPress,
  buttonStyle,
  children1,
  children,
  type = 1,
  loading = false,
  icon,
  visible,
}) => {
  return (
    <Modal
      animationType={'fade'}
      visible={visible}
      onRequestClose={onBackPress}
      transparent={true}>
      <Pressable onPress={onBackPress} style={styles.container}>
        <View style={[styles.wrapper, wrapperStyle]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={
              Platform.OS === 'ios' ? moderateScale(60) : moderateScale(0)
            }>
            {children1 ? (
              children1
            ) : (
              <>
                <View style={styles.titleContainer}>
                  {title && (
                    <Text ff="semiBold" style={styles.title} color="shadowGray">
                      {title}
                    </Text>
                  )}
                  {titleIcon && <View>{titleIcon}</View>}
                </View>

                {subtitle && (
                  <Text
                    fs="XS"
                    ff="medium"
                    color="shadowGray"
                    style={[
                      styles.title,
                      {
                        marginTop: moderateScale(10),
                        lineHeight: moderateScale(18),
                        paddingHorizontal: moderateScale(16),
                      },
                    ]}>
                    {subtitle}
                  </Text>
                )}
                {icon && <View style={{alignSelf: 'center'}}>{icon}</View>}
                {type === 1 ? (
                  <View style={[styles.buttonContainer, buttonStyle]}>
                    {onNoPress && (
                      <View style={{flex: 1}}>
                        <Button
                          title={noTitle}
                          type="outlined"
                          onPress={onNoPress}
                          buttonStyle={{
                            width: '100%',
                            marginVertical: moderateScale(0),
                            height: moderateScale(40),
                          }}
                        />
                      </View>
                    )}
                    {onYesPress && (
                      <View style={{flex: 1}}>
                        <Button
                          title={yesTitle}
                          onPress={onYesPress}
                          buttonStyle={{
                            width: '100%',
                            marginVertical: moderateScale(0),
                            height: moderateScale(40),
                          }}
                          loading={loading}
                        />
                      </View>
                    )}
                  </View>
                ) : (
                  children
                )}
              </>
            )}
          </KeyboardAvoidingView>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  wrapper: {
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(14),
    backgroundColor: colors.grey,
    shadowColor: colors.backgroundShadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: SCREEN_WIDTH - moderateScale(60),
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(16),
  },

  buttonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: moderateScale(16),
    marginTop: moderateScale(16),
    borderTopWidth: 0.5,
    borderColor: '#D5D5D5',
    paddingTop: moderateScale(16),
    paddingHorizontal: moderateScale(16),
  },
  title: {
    textAlign: 'center',
  },
  btnStyle: {
    flex: 0.5,
  },
  img: {
    height: verticalScale(65),
    width: scale(65),
    borderRadius: moderateScale(65),
    alignSelf: 'center',
  },
});
