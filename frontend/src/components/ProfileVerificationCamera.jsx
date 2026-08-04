import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  Image,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {userService} from '../api/services/userService';

const ProfileVerificationCamera = ({onImageCaptured, onVerificationSuccess, navigation}) => {
  const camera = useRef(null);
  const device = useCameraDevice('front'); // Front camera
  const {hasPermission, requestPermission} = useCameraPermission();
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const takePicture = async () => {
    if (!camera.current) {
      return;
    }

    try {
      setIsLoading(true);
      const photo = await camera.current.takePhoto({
        flash: 'off',
        qualityPrioritization: 'quality',
      });

      console.log('Photo captured:', photo.path);
      setCapturedImage(`file://${photo.path}`);

      // You can either return the photo path or upload immediately
      if (onImageCaptured) {
        onImageCaptured(photo);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture image');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadToBackend = async photo => {
    const formData = new FormData();
    formData.append('file', {
      uri: `file://${photo.path}`,
      type: 'image/jpeg',
      name: 'profile_verification.jpg',
    });

    try {
      setIsLoading(true);
      const response = await userService.verifyProfile(formData);

      if (response.data) {
        const verified = response.data?.data?.verified ?? response.data?.verified;

        if (verified) {
          // Call the success callback if provided
          if (onVerificationSuccess) {
            onVerificationSuccess(response.data);
          } else {
            Alert.alert('Success', 'Profile verified successfully!');
          }
        } else {
          const message = response.data?.data?.message || response.data?.message || 'Verification failed. Please try again.';
          Alert.alert('Verification Failed', message);
        }
        return response.data;
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to verify profile. Please try again.';
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmAndUpload = async () => {
    if (capturedImage) {
      // Get the photo object from the captured image
      const photo = {path: capturedImage.replace('file://', '')};
      await uploadToBackend(photo);
    }
  };

  // Permission handling
  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Camera permission required</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Device loading
  if (!device) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  // Show preview after capture
  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{uri: capturedImage}} style={styles.preview} />
        <View style={styles.previewActions}>
          <TouchableOpacity onPress={retakePhoto} style={styles.button}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={confirmAndUpload}
            style={[styles.button, styles.confirmButton]}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Confirm & Upload</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* Overlay for guidance */}
      <View style={styles.overlay}>
        <View style={styles.guidanceCircle} />
        <Text style={styles.guidanceText}>
          Position your face in the circle
        </Text>
      </View>

      {/* Capture button */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={takePicture}
          style={styles.captureButton}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    top: -30,
  },
  guidanceCircle: {
    // top: -20,
    width: 250,
    height: 290,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#fff',
    borderStyle: 'dashed',
  },
  guidanceText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 60,
    height: 60,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#FF0000',
  },
  preview: {
    flex: 1,
  },
  previewActions: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },
  button: {
    backgroundColor: '#666',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileVerificationCamera;
