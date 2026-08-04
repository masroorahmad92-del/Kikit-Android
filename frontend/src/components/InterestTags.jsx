import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';

const InterestTags = ({tags, onPress, containerStyle}) => {
  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text ff="c-Regular" fs="S" color="grey800" style={styles.tagText}>
              {tag}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
  },
  tag: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  tagText: {
    fontWeight: '500',
  },
});

export default InterestTags;

