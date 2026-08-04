import React from 'react';
import {View, StyleSheet, SafeAreaView, FlatList, TouchableOpacity} from 'react-native';
import {colors, moderateScale} from '../../theme';
import {Text} from '../../components/base/Text';
import BalanceCard from '../../components/BalanceCard';
import TransactionItem from '../../components/TransactionItem';
import {ArrowBack} from '../../assets/icons';
import {useKitkitStore} from '../../store/kitkitStore';

const transactionData = [
  {
    id: 1,
    title: '50 Points Gift to Sarah',
    timeAgo: '2m ago',
    avatar: require('../../assets/images/i1.jpeg'),
  },
  {
    id: 2,
    title: '50 Points Gift to Sarah',
    timeAgo: '2m ago',
    avatar: require('../../assets/images/i1.jpeg'),
  },
  {
    id: 3,
    title: '50 Points Gift to Sarah',
    timeAgo: '2m ago',
    avatar: require('../../assets/images/i1.jpeg'),
  },
  {
    id: 4,
    title: '50 Points Gift to Sarah',
    timeAgo: '2m ago',
    avatar: require('../../assets/images/i1.jpeg'),
  },
  {
    id: 5,
    title: '50 Points Gift to Sarah',
    timeAgo: '2m ago',
    avatar: require('../../assets/images/i1.jpeg'),
  },
];

const WalletScreen = ({navigation}) => {
  const {userProfile} = useKitkitStore();
  const coinBalance = userProfile?.user?.coin_balance || 0;
  const usdValue = (coinBalance * 0.10).toFixed(2);

  const handleWithdraw = () => {
    navigation.navigate('Withdraw');
  };

  const handleTransactionPress = item => {
    console.log('Transaction pressed:', item);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderItem = ({item}) => (
    <TransactionItem
      avatar={item.avatar}
      title={item.title}
      timeAgo={item.timeAgo}
      onPress={() => handleTransactionPress(item)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}>
          <ArrowBack width={24} height={24} stroke={colors.grey800} />
        </TouchableOpacity>
        <Text ff="c-Regular" fs="XXXL" color="grey800" style={styles.title}>
          My wallet
        </Text>
      </View>

      <FlatList
        data={transactionData}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Balance Card */}
            <BalanceCard
              points={coinBalance}
              usdValue={usdValue}
              onWithdraw={handleWithdraw}
            />

            {/* Recent History Title */}
            <Text
              ff="c-Regular"
              fs="XXL"
              color="grey800"
              style={styles.historyTitle}>
              Recent History
            </Text>
          </>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientBG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(20),
  },
  backButton: {
    marginRight: moderateScale(12),
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    flex: 1,
  },
  listContent: {
    paddingBottom: moderateScale(30),
  },
  historyTitle: {
    fontWeight: '700',
    marginBottom: moderateScale(20),
    marginHorizontal: moderateScale(20),
  },
});

export default WalletScreen;

