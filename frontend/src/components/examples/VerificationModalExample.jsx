import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {Button} from '../base/Button';
import VerificationModal from '../base/VerificationModal';
import {VerificationIcon} from '../../assets/icons';
import {moderateScale} from '../../theme';

const VerificationModalExample = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleShowModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleVerifyNow = () => {
    console.log('Verify Now pressed');
    setModalVisible(false);
    // Add verification logic here
  };

  const handleMaybeLater = () => {
    console.log('Maybe Later pressed');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Button
        title="Show Verification Modal"
        onPress={handleShowModal}
        buttonStyle={styles.button}
      />

      <VerificationModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onPrimaryPress={handleVerifyNow}
        onSecondaryPress={handleMaybeLater}
        icon={<VerificationIcon width={60} height={60} />}
        title="Get Verified"
        description="Verify your profile with a quick selfie. If it matches your profile, you'll get a verified badge. Your selfie stays private with us"
        primaryButtonText="Verify Now"
        secondaryButtonText="Maybe Later"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  button: {
    width: '100%',
    height: moderateScale(50),
  },
});

export default VerificationModalExample;
