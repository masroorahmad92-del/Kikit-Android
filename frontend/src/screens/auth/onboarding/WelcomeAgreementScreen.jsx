import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Button } from '../../../components/base/Button';
import { Text } from '../../../components/base/Text';
import { userService } from '../../../api/services/userService';
import { useKitkitStore } from '../../../store/kitkitStore';
import { colors, fonts, moderateScale } from '../../../theme';

const APPLE_EULA_URL =
  'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = 'https://www.letskikit.com/privacy';

const communityRules = [
  'No objectionable, abusive, threatening, hateful, sexual, or harassing content.',
  'No fake profiles, spam, scams, or attempts to mislead other members.',
  'Use report and block tools when another member breaks these rules.',
  'Kikit reviews reports within 24 hours and may remove content or eject abusive users.',
];

const WelcomeAgreementScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUserProfile, userProfile } = useKitkitStore();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const openLink = async url => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Unable to open link',
        text2: 'Please try again later.',
      });
    }
  };

  const handleAcceptAndContinue = async () => {
    if (!accepted || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await userService.completeProfile({
        acknowledged_terms: true,
      });
      const updatedProfile = response?.data?.data;

      setUserProfile(
        updatedProfile || {
          ...userProfile,
          acknowledged_terms: true,
        },
      );

      Toast.show({
        type: 'success',
        text1: 'Welcome to Kikit',
        text2: 'Community terms accepted.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not save agreement',
        text2: error?.message || 'Please check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text fs="XXXL" color="grey800" style={styles.title}>
              Kikit Community Agreement
            </Text>
            <Text fs="M" color="grey600" style={styles.subtitle}>
              Before entering Kikit, please agree to our zero-tolerance safety
              rules for objectionable content and abusive users.
            </Text>
          </View>

          <View style={styles.card}>
            <Text fs="XL" color="grey800" style={styles.cardTitle}>
              Zero tolerance rules
            </Text>
            {communityRules.map(rule => (
              <View key={rule} style={styles.ruleRow}>
                <View style={styles.ruleDot} />
                <Text fs="S" color="grey700" style={styles.ruleText}>
                  {rule}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.noticeCard}>
            <Text fs="M" color="grey800" style={styles.noticeTitle}>
              By continuing, you agree that:
            </Text>
            <Text fs="S" color="grey600" style={styles.noticeText}>
              Kikit may review reports, remove objectionable content, block or
              suspend abusive users, and take action needed to keep the
              community safe.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setAccepted(value => !value)}
            style={styles.checkboxRow}>
            <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
              {accepted ? <View style={styles.checkboxInner} /> : null}
            </View>
            <Text fs="S" color="grey700" style={styles.checkboxText}>
              I agree to the Terms of Use
            </Text>
          </TouchableOpacity>

          <View style={styles.linkRow}>
            <TouchableOpacity onPress={() => openLink(APPLE_EULA_URL)}>
              <Text fs="S" color="primary" style={styles.linkText}>
                Terms of Use
              </Text>
            </TouchableOpacity>
            <Text fs="S" color="grey400" style={styles.linkSeparator}>
              |
            </Text>
            <TouchableOpacity onPress={() => openLink(PRIVACY_URL)}>
              <Text fs="S" color="primary" style={styles.linkText}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.buttonSection}>
          <Button
            title={isSubmitting ? 'Saving...' : 'Accept and Continue'}
            onPress={handleAcceptAndContinue}
            loading={isSubmitting}
            type={accepted && !isSubmitting ? 'default' : 'disabled'}
            buttonStyle={styles.acceptButton}
            textStyle={styles.acceptButtonText}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  acceptButton: {
    width: '100%',
  },
  acceptButtonText: {
    fontFamily: fonts.CabinetBold,
    fontSize: moderateScale(16),
  },
  buttonSection: {
    backgroundColor: colors.white,
    borderTopColor: colors.grey100,
    borderTopWidth: 1,
    paddingBottom: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(12),
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.grey100,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    padding: moderateScale(16),
  },
  cardTitle: {
    fontFamily: fonts.CabinetBold,
    marginBottom: moderateScale(12),
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.grey300 || colors.grey200,
    borderRadius: moderateScale(6),
    borderWidth: 2,
    height: moderateScale(24),
    justifyContent: 'center',
    marginTop: moderateScale(2),
    width: moderateScale(24),
  },
  checkboxChecked: {
    borderColor: colors.primary,
  },
  checkboxInner: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(3),
    height: moderateScale(12),
    width: moderateScale(12),
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  checkboxText: {
    flex: 1,
    fontFamily: fonts.CabinetRegular,
    lineHeight: 20,
  },
  container: {
    backgroundColor: '#F8F4FF',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingTop: moderateScale(20),
  },
  linkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: moderateScale(6),
  },
  linkSeparator: {
    marginHorizontal: moderateScale(10),
  },
  linkText: {
    fontFamily: fonts.CabinetBold,
  },
  noticeCard: {
    backgroundColor: '#FFF7FA',
    borderColor: '#FFD6E5',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    padding: moderateScale(16),
  },
  noticeText: {
    fontFamily: fonts.CabinetRegular,
    lineHeight: 20,
  },
  noticeTitle: {
    fontFamily: fonts.CabinetBold,
    marginBottom: moderateScale(8),
  },
  ruleDot: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(4),
    height: moderateScale(8),
    marginTop: moderateScale(6),
    width: moderateScale(8),
  },
  ruleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  ruleText: {
    flex: 1,
    fontFamily: fonts.CabinetRegular,
    lineHeight: 20,
  },
  scrollContent: {
    gap: moderateScale(16),
    paddingBottom: moderateScale(20),
    paddingHorizontal: moderateScale(20),
  },
  subtitle: {
    fontFamily: fonts.CabinetRegular,
    lineHeight: 22,
    marginTop: moderateScale(10),
  },
  title: {
    fontFamily: fonts.CabinetBold,
    lineHeight: 40,
  },
});

export default WelcomeAgreementScreen;
