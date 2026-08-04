import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {storageUtil} from './storage';

export const useKitkitStore = create(
  persist(
    set => ({
      user: null,
      apiToken: null,
      userProfile: null,
      isPremium: false,
      activePlan: null, // 'monthly' | 'annual' | null
      onboardingPhotos: [],
      ssoProfile: null,

      setUser: data => set({user: data}),
      setUserProfile: data => set({userProfile: data}),
      setSsoProfile: ssoProfile => set({ssoProfile}),
      setIsPremium: isPremium => set({isPremium}),
      setActivePlan: activePlan => set({activePlan}),
      setOnboardingPhotos: photos => set({onboardingPhotos: photos}),

      setToken: apiToken => set({apiToken}),

      removeUser: () =>
        set({user: null, apiToken: null, userProfile: null, isPremium: false, activePlan: null, onboardingPhotos: [], ssoProfile: null}),
    }),
    {
      name: 'kitkit-storage', // unique name for storage key
      storage: createJSONStorage(() => storageUtil), // uses your custom storage
    },
  ),
);
