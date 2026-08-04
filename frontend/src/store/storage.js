import {MMKV} from 'react-native-mmkv';

export const storage = new MMKV();

export const storageUtil = {
  setItem: (key, value) => {
    storage.set(key, JSON.stringify(value));
  },

  getItem: key => {
    const value = storage.getString(key);
    return value ? JSON.parse(value) : null;
  },

  removeItem: key => {
    storage.delete(key);
  },

  clear: () => {
    storage.clearAll();
  },
};
