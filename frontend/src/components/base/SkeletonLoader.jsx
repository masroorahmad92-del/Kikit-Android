import React from "react"
import { View, StyleSheet } from "react-native"
import SkeletonPlaceholder from "react-native-skeleton-placeholder"
import { SCREEN_HEIGHT, SCREEN_WIDTH, moderateScale } from "../../theme"

export const SkeletonLoader = props => {
  const { rows = [1, 2, 3, 4], midRow = false } = props

  return (
    <SkeletonPlaceholder backgroundColor={"#E7F4F8"}>
      <View style={styles.loaderContainer}>
        <View style={styles.loaderRowContainer} />
      </View>
      {midRow && (
        <View style={styles.loaderContainer}>
          <View style={styles.loaderMidRowContainer} />
        </View>
      )}
      {rows.map((val, ind) => {
        return (
          <View key={(ind + val).toString()} style={styles.loaderContainer}>
            <View style={styles.loaderRowContainer} />
          </View>
        )
      })}
    </SkeletonPlaceholder>
  )
}

const styles = StyleSheet.create({
  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(15)
  },
  loaderRowContainer: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.08,
    borderRadius: 5
  },
  loaderMidRowContainer: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.25,
    borderRadius: 5
  }
})
