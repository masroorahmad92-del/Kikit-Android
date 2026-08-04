import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';
import {EditPencil} from '../assets/icons';

const AboutSection = ({title, content, onEditPress, containerStyle}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.header}>
        <Text ff="c-Regular" fs="L" color="grey800" style={styles.title}>
          {title}
        </Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={onEditPress}
          activeOpacity={0.8}>
          <EditPencil width={20} height={20} stroke={colors.secondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.contentContainer}>
        <Text ff="c-Regular" fs="M" color="grey800" style={styles.content}>
          {content}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  title: {
    fontWeight: '700',
  },
  editButton: {
    padding: moderateScale(4),
  },
  contentContainer: {
    backgroundColor: 'rgba(189, 224, 254, 0.2)',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
  },
  content: {
    fontWeight: '400',
    lineHeight: moderateScale(22),
  },
});

export default AboutSection;

