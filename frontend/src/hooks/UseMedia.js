import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

import {Alert} from 'react-native';

export const UseMedia = () => {
  const fromGallery = async (selectionLimit = 1) => {
    let options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 4000,
      maxHeight: 4000,
      selectionLimit: selectionLimit,
    };

    return new Promise((resolve, reject) => {
      try {
        launchImageLibrary(options, response => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.errorCode) {
            console.log('ImagePicker Error: ', response.errorCode);
          } else if (response.errorCode === 'permission') {
            console.log('Permission error');
          } else {
            const validAssets = response.assets.filter(asset => {
              const fileType = asset.type;
              return (
                fileType === 'image/jpeg' ||
                fileType === 'image/jpg' ||
                fileType === 'image/png'
              );
            });

            if (validAssets.length === 0) {
              Alert.alert(
                'Invalid file type',
                'Please select PNG, JPEG, or JPG images.',
              );
            } else if (validAssets.length < response.assets.length) {
              Alert.alert(
                'Some files skipped',
                'Only PNG, JPEG, and JPG images are supported. Invalid files were skipped.',
              );
              const fileName = validAssets[0].uri.split('/').pop();
              resolve([{...response, assets: validAssets}, fileName]);
            } else {
              const fileName = validAssets[0].uri.split('/').pop();
              resolve([{...response, assets: validAssets}, fileName]);
            }
          }
        });
      } catch (error) {
        console.log('Error selecting image from gallery:', error);
        reject(error);
      }
    });
  };

  const fromCamera = async () => {
    let options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 4000,
      maxHeight: 4000,
      selectionLimit: 1,
    };

    return new Promise((resolve, reject) => {
      try {
        launchCamera(options, response => {
          if (response.didCancel) {
            console.log('User cancelled the camera');
          } else if (response.errorCode) {
            console.log('ImagePicker Error: ', response.errorCode);
          } else if (response.errorCode === 'permission') {
            console.log('Permission error');
          } else {
            const fileName = response?.assets[0].uri.split('/').pop();
            resolve([response, fileName]);
          }
        });
      } catch (error) {
        try {
          let values = {
            SEVERITY: 'ERROR',
            TIMESTAMP: new Date().toLocaleString(),
            PAGE: 'APP',
            ORIGIN: '',
            CODE: '',
            ERROR: error,
            MESSAGE: error.message,
          };
          // writeDataToRemoteDatabase(END_POINTS.uiError, values);
        } catch {}

        reject(error);
      }
    });
  };

  const createFormData = file => {
    let formDataObject = new FormData();
    formDataObject.append('file', {
      uri: file?.uri,
      type: file?.type,
      name: file?.fileName || file?.name,
    });
    return formDataObject;
  };

  return {
    fromGallery,
    createFormData,
    fromCamera,
  };
};
