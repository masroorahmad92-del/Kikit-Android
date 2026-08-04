import React, {useEffect, useState} from 'react';
import {Keyboard, ScrollView, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Colors, moderateScale} from '../../theme';
import {Header} from './Header';
import {Loader} from './Loader';

export const Wrapper = ({
  children,
  onPress,
  onRightPress,
  style,
  header = true,
  loading = false,
  rightLoading = false,
  scroll = false,
  edges = ['top', 'left', 'right', 'bottom'],
  rightIcon,
  title = '',
  paddingHorizontal = true,
  safeAreaView = true,
  bounces = true,
  leftIcon,
  border = false,
  centerContent,
  customStyle,
}) => {
  const containerStyle = style ?? {
    flex: scroll ? undefined : 1,
    paddingBottom: scroll ? moderateScale(70) : undefined,
    paddingHorizontal: paddingHorizontal ? moderateScale(16) : 0,
  };
  const [keyboardSpace, setKeyboardSpace] = useState(0);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      event => {
        setKeyboardSpace(event.endCoordinates.height);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardSpace(0);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const getScrollView = () => (
    <ScrollView
      bounces={bounces}
      contentContainerStyle={[
        containerStyle,
        {
          paddingBottom: keyboardSpace,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
  const getView = () => <View style={containerStyle}>{children}</View>;

  return (
    <View style={{flex: 1, backgroundColor: Colors.white}}>
      {loading && <Loader loading={loading} />}
      {safeAreaView ? (
        <SafeAreaView style={{flex: 1}} edges={edges}>
          {header && (
            <Header
              onPress={onPress}
              onRightPress={onRightPress}
              loading={rightLoading}
              rightIcon={rightIcon}
              title={title}
              leftIcon={leftIcon}
              border={border}
              centerContent={centerContent}
              customStyle={customStyle}
            />
          )}
          {scroll ? getScrollView() : getView()}
        </SafeAreaView>
      ) : (
        <>
          {header && (
            <Header
              onPress={onPress}
              onRightPress={onRightPress}
              loading={rightLoading}
              rightIcon={rightIcon}
              title={title}
              leftIcon={leftIcon}
              border={border}
              centerContent={centerContent}
              customStyle={customStyle}
            />
          )}
          {scroll ? getScrollView() : getView()}
        </>
      )}
    </View>
  );
};
