import React, {useState} from 'react';
import {TouchableOpacity, StyleSheet, View, LayoutAnimation, Platform, UIManager} from 'react-native';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';
import {ChevronRight, ChevronUp} from '../assets/icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CollapsibleMenuItem = ({
  icon,
  title,
  subItems = [],
  containerStyle,
  iconBgColor = colors.white,
  defaultExpanded = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(!defaultExpanded);

  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCollapsed(!isCollapsed);
  };

  return (
    <View style={containerStyle}>
      {/* Main Item */}
      <TouchableOpacity
        style={styles.container}
        onPress={toggleCollapse}
        activeOpacity={0.7}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, {backgroundColor: iconBgColor}]}>
            {icon}
          </View>
          <Text ff="c-Regular" fs="L" color="grey800" style={styles.title}>
            {title}
          </Text>
        </View>
        {isCollapsed ? (
          <ChevronRight width={20} height={20} stroke={colors.grey400} />
        ) : (
          <ChevronUp width={20} height={20} stroke={colors.grey400} />
        )}
      </TouchableOpacity>

      {/* Collapsible Sub Items */}
      {!isCollapsed && (
        <View style={styles.subItemsContainer}>
          {subItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.subItem}
              onPress={item.onPress}
              activeOpacity={0.7}>
              <Text
                ff="c-Regular"
                fs="M"
                color="grey800"
                style={styles.subItemText}>
                {item.title}
              </Text>
              <ChevronRight
                width={18}
                height={18}
                stroke={colors.grey400}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    backgroundColor: 'transparent',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontWeight: '600',
  },
  subItemsContainer: {
    paddingLeft: moderateScale(76),
    paddingRight: moderateScale(20),
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(14),
  },
  subItemText: {
    fontWeight: '400',
  },
});

export default CollapsibleMenuItem;

