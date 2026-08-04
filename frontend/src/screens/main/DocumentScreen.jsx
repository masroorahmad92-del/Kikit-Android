import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {Text} from '../../components/base/Text';
import {colors, moderateScale} from '../../theme';
import {ArrowBack} from '../../assets/icons';

const DocumentScreen = ({route, navigation}) => {
  const {type} = route.params; // 'privacy' or 'terms'

  const isPrivacyPolicy = type === 'privacy';

  const title = isPrivacyPolicy ? 'Privacy Policy' : 'Terms & Conditions';

  // Dummy content for Privacy Policy
  const privacyPolicyContent = `
Last Updated: ${new Date().toLocaleDateString()}

1. INTRODUCTION

Welcome to Kikit. We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.

2. INFORMATION WE COLLECT

We collect information that you provide directly to us, including:
- Profile information (name, age, photos, bio)
- Contact information
- Preferences and interests
- Location data (with your permission)
- Communication data

3. HOW WE USE YOUR INFORMATION

We use the information we collect to:
- Provide, maintain, and improve our services
- Suggest potential connections
- Send you notifications and updates
- Respond to your inquiries and support requests
- Ensure platform safety and security

4. INFORMATION SHARING

We do not sell your personal information. We may share your information only:
- With other users as part of the Kikit discovery experience
- With service providers who assist us in operating our platform
- When required by law or to protect our rights

5. DATA SECURITY

We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

6. YOUR RIGHTS

You have the right to:
- Access your personal information
- Correct inaccurate data
- Delete your account and data
- Opt-out of certain communications

7. CONTACT US

If you have questions about this Privacy Policy, please contact us at admin@letskikit.com.
  `;

  // Dummy content for Terms & Conditions
  const termsContent = `
Last Updated: ${new Date().toLocaleDateString()}

1. ACCEPTANCE OF TERMS

By accessing and using Kikit, you accept and agree to be bound by the terms and provision of this agreement.

2. ELIGIBILITY

You must be at least 18 years old to use Kikit. By using our service, you represent and warrant that you meet this age requirement.

3. USER ACCOUNTS

You are responsible for:
- Maintaining the confidentiality of your account
- All activities that occur under your account
- Providing accurate and current information

4. USER CONDUCT

You agree not to:
- Use the service for any illegal purpose
- Harass, abuse, or harm other users
- Post false, misleading, or offensive content
- Impersonate any person or entity
- Violate any applicable laws or regulations

5. CONTENT

You retain ownership of content you post, but grant us a license to use, modify, and display such content on our platform.

6. DISCOVERY AND CONNECTIONS

We use algorithms to suggest potential connections. We do not guarantee conversations or successful connections.

7. SUBSCRIPTIONS AND PAYMENTS

Some features may require a paid subscription. All fees are non-refundable unless required by law.

8. TERMINATION

We reserve the right to suspend or terminate your account at any time for violations of these terms.

9. DISCLAIMER

The service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service.

10. LIMITATION OF LIABILITY

To the maximum extent permitted by law, Kikit shall not be liable for any indirect, incidental, or consequential damages.

11. CHANGES TO TERMS

We may modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.

12. CONTACT INFORMATION

For questions about these Terms & Conditions, please contact us at support@kikit.com.
  `;

  const content = isPrivacyPolicy ? privacyPolicyContent : termsContent;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          style={styles.backButton}>
          <ArrowBack width={24} height={24} fill={colors.grey800} />
        </TouchableOpacity>
        <Text ff="c-Regular" fs="XL" color="grey800" style={styles.headerTitle}>
          {title}
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}>
        <Text ff="c-Regular" fs="M" color="grey800" style={styles.content}>
          {content.trim()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white || '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.grey200 || '#E8E8E8',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: moderateScale(20),
    paddingBottom: moderateScale(40),
  },
  content: {
    lineHeight: moderateScale(24),
    color: colors.grey800 || '#1A1A1A',
  },
});

export default DocumentScreen;

