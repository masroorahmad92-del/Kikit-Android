import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import {colors, moderateScale} from '../../theme';
import {Text} from '../../components/base/Text';
import GradientBackground from '../../components/GradientBackground';
import {ArrowBack} from '../../assets/icons';
import {useKitkitStore} from '../../store/kitkitStore';
import Toast from 'react-native-toast-message';

const COIN_VALUE = 0.10;
const MIN_WITHDRAW = 200;

const PRESET_AMOUNTS = [50, 250, 500, 1000, 2000, 3000];

const WithdrawScreen = ({navigation}) => {
  const {userProfile} = useKitkitStore();
  const coinBalance = userProfile?.user?.coin_balance || 0;

  const [selectedAmount, setSelectedAmount] = useState(MIN_WITHDRAW);

  const usdValue = (selectedAmount * COIN_VALUE).toFixed(2);

  const handlePresetPress = amount => {
    if (amount > coinBalance) {
      Toast.show({
        type: 'error',
        text1: 'Insufficient balance',
        text2: `You only have ${coinBalance} coins`,
      });
      return;
    }
    setSelectedAmount(amount);
  };

  const handleIncrement = () => {
    const newAmount = selectedAmount + 50;
    if (newAmount <= coinBalance) {
      setSelectedAmount(newAmount);
    }
  };

  const handleDecrement = () => {
    const newAmount = selectedAmount - 50;
    if (newAmount >= 0) {
      setSelectedAmount(newAmount);
    }
  };

  const handleInputChange = text => {
    const num = parseInt(text, 10);
    if (text === '') {
      setSelectedAmount(0);
    } else if (!isNaN(num) && num >= 0) {
      if (num > coinBalance) {
        setSelectedAmount(coinBalance);
        Toast.show({
          type: 'error',
          text1: 'Maximum exceeded',
          text2: `You only have ${coinBalance} coins`,
        });
      } else {
        setSelectedAmount(num);
      }
    }
  };

  const handleContinue = () => {
    if (selectedAmount < MIN_WITHDRAW) {
      Toast.show({
        type: 'error',
        text1: `Minimum withdrawal is ${MIN_WITHDRAW} coins`,
      });
      return;
    }
    if (selectedAmount > coinBalance) {
      Toast.show({
        type: 'error',
        text1: 'Insufficient balance',
        text2: `You only have ${coinBalance} coins`,
      });
      return;
    }
    console.log('Withdraw:', selectedAmount, 'coins =', `$${usdValue}`);
    navigation.navigate('ConfirmWithdraw', {coins: selectedAmount});
  };

  const isValid = selectedAmount >= MIN_WITHDRAW && selectedAmount <= coinBalance;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBack width={24} height={24} stroke={colors.grey800} />
          </TouchableOpacity>
          <Text ff="c-Bold" fs="XXL" color="grey800" style={styles.headerTitle}>
            Withdraw Coins
          </Text>
          <View style={{width: 24}} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Amount Display */}
          <View style={styles.amountRow}>
            <Text ff="c-Bold" fs="XXXL" color="grey800" numberOfLines={1} adjustsFontSizeToFit>
              {selectedAmount} Coins
            </Text>
            <Text ff="c-Bold" fs="XXXL" color="grey800" numberOfLines={1} adjustsFontSizeToFit>
              ${usdValue} USD
            </Text>
          </View>

          {/* Choose Coins Label */}
          <Text ff="c-Bold" fs="L" color="grey800" style={styles.chooseLabel}>
            Choose Coins
          </Text>

          {/* Preset Buttons */}
          <View style={styles.presetsGrid}>
            {PRESET_AMOUNTS.map(amount => {
              const isSelected = selectedAmount === amount;
              return (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.presetButton,
                    isSelected && styles.presetButtonSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handlePresetPress(amount)}>
                  <Text
                    ff="c-Bold"
                    fs="S"
                    color={isSelected ? 'white' : 'grey800'}>
                    {amount} Coins
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Input */}
          <View style={styles.customInputRow}>
            <TouchableOpacity
              style={styles.circleButton}
              onPress={handleDecrement}
              activeOpacity={0.7}>
              <Text ff="c-Bold" fs="XL" color="grey800">
                −
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              value={String(selectedAmount)}
              onChangeText={handleInputChange}
              keyboardType="number-pad"
              maxLength={10}
              placeholder="Or, input your amount"
              placeholderTextColor={colors.grey400}
              textAlign="center"
            />

            <TouchableOpacity
              style={styles.circleButton}
              onPress={handleIncrement}
              activeOpacity={0.7}>
              <Text ff="c-Bold" fs="XL" color="grey800">
                +
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <Text ff="c-Regular" fs="S" color="grey800" style={styles.infoText}>
              ⓘ  The minimum withdraw is {MIN_WITHDRAW} coins
            </Text>
            <Text ff="c-Regular" fs="S" color="grey800" style={styles.infoText}>
              {'    '}1 coin = ${COIN_VALUE.toFixed(2)}
            </Text>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isValid && styles.continueButtonDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleContinue}>
            <Text ff="c-Bold" fs="L" color="white">
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
  },
  headerTitle: {
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(20),
    marginBottom: moderateScale(24),
  },
  chooseLabel: {
    fontWeight: '700',
    marginBottom: moderateScale(14),
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
    marginBottom: moderateScale(20),
  },
  presetButton: {
    width: '31%',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: colors.grey200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  presetButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: moderateScale(30),
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(6),
    marginBottom: moderateScale(24),
  },
  circleButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    borderWidth: 1.5,
    borderColor: colors.grey300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: colors.grey800,
    paddingVertical: moderateScale(6),
    fontFamily: 'ClashGrotesk-Medium',
  },
  infoContainer: {
    marginBottom: moderateScale(10),
  },
  infoText: {
    lineHeight: moderateScale(22),
  },
  bottomContainer: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
    paddingTop: moderateScale(10),
  },
  continueButton: {
    backgroundColor: colors.secondary,
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(30),
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
});

export default WithdrawScreen;
