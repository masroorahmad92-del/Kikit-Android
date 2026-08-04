# Kikit - React Native Dating Application

**Version:** 0.0.1
**Platforms:** iOS and Android
**API Base URL:** `https://kikit-app.onrender.com/api/v1/`

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Navigation Architecture](#navigation-architecture)
5. [Screens Reference](#screens-reference)
6. [State Management](#state-management)
7. [API Services](#api-services)
8. [Components Library](#components-library)
9. [Authentication Flows](#authentication-flows)
10. [Chat & Video Calling](#chat--video-calling)
11. [Theme & Design System](#theme--design-system)
12. [Key Features](#key-features)
13. [Dependencies](#dependencies)
14. [Configuration Files](#configuration-files)

---

## Overview

Kikit is a modern dating/matching mobile application built with React Native. It features swipe-based profile discovery, real-time messaging, video calling, and social authentication.

### Key Technologies
- React Native 0.79.6
- React Navigation 7.x
- Stream.io Chat & Video SDKs
- TanStack React Query (Data Management)
- Zustand (State Management)
- Formik & Yup (Form Validation)
- Jotai (Atomic State)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React Native 0.79.6 |
| Navigation | React Navigation 7.x |
| State Management | Zustand + Jotai |
| Server State | TanStack React Query |
| Chat SDK | Stream Chat 9.26.0 |
| Video SDK | Stream Video 1.24.7 |
| Storage | React Native MMKV |
| Forms | Formik + Yup |
| Animations | React Native Reanimated 4.x |
| HTTP Client | Axios |

---

## Project Structure

```
/kikit
├── src/
│   ├── api/                    # API Integration Layer
│   │   ├── interceptor.js      # Axios instance with auth interceptors
│   │   ├── onboardingService.js
│   │   ├── userService.js
│   │   ├── preferencesService.js
│   │   └── matchesService.js
│   │
│   ├── assets/                 # Images, Icons, Fonts
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── components/             # Reusable UI Components
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Header.jsx
│   │   └── ... (40+ components)
│   │
│   ├── constants/              # Application Constants
│   │
│   ├── hooks/                  # Custom React Hooks
│   │
│   ├── navigation/             # Navigation Configuration
│   │   ├── RootNavigator.js
│   │   ├── AuthStackNavigator.js
│   │   ├── MainStackNavigator.js
│   │   └── BottomTabs.js
│   │
│   ├── providers/              # Context/Provider Components
│   │
│   ├── screens/                # Full Screen Components
│   │   ├── auth/               # Authentication screens
│   │   ├── main/               # Main app screens
│   │   └── stream/             # Chat/Video screens
│   │
│   ├── store/                  # Global State Management
│   │   ├── kitkitStore.js      # Zustand store
│   │   └── storage.js          # MMKV storage utility
│   │
│   ├── theme/                  # Design Tokens & Colors
│   │   ├── colors.js
│   │   ├── fontSize.js
│   │   └── fontFamily.js
│   │
│   └── utils/                  # Utility Functions
│       ├── constants.js
│       └── helpers.js
│
├── ios/                        # iOS Native Code
├── android/                    # Android Native Code
├── App.jsx                     # Root App Component
├── index.js                    # Entry Point
├── app.json                    # App Configuration
└── package.json                # Dependencies
```

---

## Navigation Architecture

### Hierarchy

```
RootNavigator
├── AuthStackNavigator (Unauthenticated)
│   ├── Onboard1 (Welcome)
│   ├── Onboard2 (Social Login)
│   ├── Onboard3 (Phone Number)
│   ├── Onboard4
│   ├── Onboard5
│   ├── Login
│   ├── EmailInput
│   ├── Signup
│   ├── OTPVerification
│   ├── LocationPermissionScreen
│   └── VerifyYourProfileScreen
│
└── MainStackNavigator (Authenticated)
    ├── ChatProvider
    ├── VideoProvider
    ├── CallProvider
    │
    └── Nested Navigation
        ├── BottomTabs
        │   ├── Home (Swipe Cards)
        │   ├── Liked You
        │   ├── Gifts
        │   ├── Chat
        │   └── Profile
        │
        ├── ProfileDetail (Modal)
        ├── EditProfile
        ├── ProfileVerification
        ├── chats (Channel List)
        ├── chat (Individual Chat)
        ├── thread-screen
        ├── video-call
        └── call
```

### Navigation Files

| File | Purpose |
|------|---------|
| `RootNavigator.js` | Root container, decides Auth vs Main based on `apiToken` |
| `AuthStackNavigator.js` | Authentication/onboarding flow |
| `MainStackNavigator.js` | Main app with nested providers |
| `BottomTabs.js` | 5-tab bottom navigation |

---

## Screens Reference

### Authentication Screens

| Screen | Path | Purpose |
|--------|------|---------|
| Login | `auth/login/Login.jsx` | Profile verification via camera |
| EmailInput | `auth/login/EmailInput.jsx` | Email entry for signup |
| Signup | `auth/login/Signup.jsx` | Account creation with validation |
| OTPVerification | `auth/login/OTPVerification.jsx` | Email/Phone OTP verification |
| Onboard1 | `auth/onboarding/Onboard1.jsx` | Animated welcome screens |
| Onboard2 | `auth/onboarding/Onboard2.jsx` | Google/Apple OAuth login |
| Onboard3 | `auth/onboarding/Onboard3.jsx` | Phone number entry |
| LocationPermissionScreen | `auth/onboarding/LocationPermissionScreen.jsx` | Location access request |
| VerifyYourProfileScreen | `auth/onboarding/VerifyYourProfileScreen.jsx` | Profile verification step |

### Main App Screens

| Screen | Path | Purpose |
|--------|------|---------|
| HomeScreen | `main/HomeScreen.jsx` | Swipe card interface for discovering matches |
| LikedYouScreen | `main/LikedYouScreen.jsx` | Profiles that liked the user |
| GiftsScreen | `main/GiftsScreen.jsx` | Gift/reward system |
| ChatScreen | `main/ChatScreen.jsx` | Chat tab placeholder |
| ProfileScreen | `main/ProfileScreen.jsx` | User profile, settings, logout |
| EditProfileScreen | `main/EditProfileScreen.jsx` | Edit profile with modals |
| ProfileDetailScreen | `main/ProfileDetailScreen.jsx` | View detailed user profile |
| WalletScreen | `main/WalletScreen.jsx` | Wallet/points display |

### Stream Screens (Chat/Video)

| Screen | Path | Purpose |
|--------|------|---------|
| Chats | `stream/Chats.jsx` | Channel list with custom preview |
| Chat | `stream/Chat.jsx` | Individual chat with video call button |
| ThreadScreen | `stream/ThreadScreen.jsx` | Message thread view |
| Call | `stream/Call.jsx` | Active call with RingingCallContent |
| VideoCall | `stream/VideoCall.jsx` | Video call interface |

---

## State Management

### Zustand Store

**Location:** `src/store/kitkitStore.js`

```javascript
useKitkitStore = {
  // State
  user: null,           // JWT token, access_token, user ID, stream tokens
  userProfile: null,    // User profile data
  apiToken: null,       // API authentication token

  // Actions
  setUser(data),        // Set user authentication data
  setUserProfile(data), // Set user profile
  setToken(apiToken),   // Set API token
  removeUser(),         // Clear all data (logout)
}
```

### MMKV Storage

**Location:** `src/store/storage.js`

```javascript
storageUtil = {
  setItem(key, value),   // Persist data
  getItem(key),          // Retrieve data
  removeItem(key),       // Remove specific data
  clear(),               // Clear all data
}
```

### Jotai Atoms

Used for atomic state:
- `selectedThreadAtom` - Selected message thread
- `selectedChannelAtom` - Selected chat channel

---

## API Services

### Interceptor Configuration

**Location:** `src/api/interceptor.js`

- Base URL: `https://kikit-app.onrender.com/api/v1/`
- Request interceptor adds Bearer token from `user.access_token`
- Response interceptor handles 401 errors with logout
- Default timeout: 10 seconds

### Onboarding Service

```
POST   /users/signup/              Create new user
POST   /users/login/               Login user
POST   /otp/verify/                Verify OTP
POST   /otp/resend/                Resend OTP
POST   /phone-verification/send/   Send phone OTP
```

### User Service

```
GET    /profiles/me                Get current user profile
POST   /profiles/                  Create profile
PATCH  /profiles/                  Update profile
POST   /profiles/verify            Verify profile (with image)
POST   /media/upload               Upload media
DELETE /media/delete/{publicId}/   Delete media
DELETE /users/me                   Delete account
```

### Preferences Service

```
GET    /interests/                 Get all interests
GET    /hobbies/                   Get all hobbies
GET    /preferences/me             Get user preferences
PUT    /preferences/me             Update preferences
```

### Matches Service

```
GET    /matches/                   Get matches
GET    /profiles/{profileId}       Get profile by ID
POST   /profile-likes/{id}/like    Like profile
POST   /profile-likes/{id}/like    Unlike profile
GET    /profile-likes/liked-me     Get profiles who liked user
```

---

## Components Library

### Base Components

| Component | Purpose |
|-----------|---------|
| `Button.jsx` | Gradient button with loading state, multiple types |
| `Input.jsx` | Form input field |
| `Text.jsx` | Custom text with theming |
| `Header.jsx` | Screen header |
| `Loader.jsx` | Loading indicator |
| `OTPInput.jsx` | 4-digit OTP input |
| `FadeModal.jsx` | Fade in/out modal |
| `Toast.jsx` | Custom toast notification |

### Feature Components

| Component | Purpose |
|-----------|---------|
| `Card.jsx` | Swipeable profile card with pan gesture |
| `HomeHeader.jsx` | Home screen header with filters |
| `ProfileHeader.jsx` | User profile header section |
| `ProfilePhotoSection.jsx` | Photo gallery section |
| `LikeProfileCard.jsx` | Card for liked profiles |
| `LikeDislikeAnimation.jsx` | Like/dislike animations |
| `EditProfileModals.jsx` | Modals for editing fields |
| `FilterSheet.jsx` | Bottom sheet filter |

### Onboarding Components

| Component | Purpose |
|-----------|---------|
| `NameInputComponent` | Name input |
| `BioInputComponent` | Bio/description input |
| `BirthdayInputComponent` | Birthday picker |
| `PhotoUploadComponent` | Photo upload |
| `HobbiesComponent` | Hobbies selection |
| `InterestsComponent` | Interests selection |

---

## Authentication Flows

### Email/Password Signup

```
1. Signup.jsx → Form validation with Yup
2. useMutation(onboardingService.createUser)
3. Navigate to EmailInput
4. EmailInput.jsx → OTP entry
5. useMutation(onboardingService.verifyEmailOTP)
6. Set user in store with access_token
7. Navigate to Onboard3 → Phone number
8. Complete profile setup
```

### Social Login (Google/Apple)

```
1. Onboard2.jsx
2. Trigger Google Sign-In or Apple Sign-In
3. Get ID Token
4. Backend exchanges ID token for JWT
5. Continue to onboarding
```

### Token Persistence

1. User logs in → Token stored in Zustand
2. Zustand persists to MMKV storage
3. On app reload → Store hydrates from MMKV
4. API interceptor uses token for all requests
5. 401 error → Logout and redirect to auth

---

## Chat & Video Calling

### Stream Chat Integration

**ChatProvider** (`ChatProvider.jsx`)
- Initializes Stream Chat client with API key
- Connects user with Stream token
- Renders OverlayProvider + Chat components

**Chats Screen** (`Chats.jsx`)
- Channel list with custom preview
- Shows: avatar, name, last message, timestamp, unread count
- Read receipts with double-tick icon

**Chat Screen** (`Chat.jsx`)
- Individual channel view
- Stream `Channel`, `MessageList`, `MessageInput` components
- Video call button to initiate calls

### Stream Video Integration

**VideoProvider** (`VideoProvider.jsx`)
- Initializes StreamVideoClient
- Connects user for video calls

**CallProvider** (`CallProvider.jsx`)
- Monitors active calls via `useCalls()` hook
- Handles call events: rejected, ended, canceled, left
- Floating "Active Call" button during calls

**Call Screen** (`Call.jsx`)
- `StreamCall` wrapper with active call
- Ringing state: `RingingCallContent`
- Joined state: `CallContent`

### Chat to Video Flow

```
1. Chat.jsx → User taps phone icon
2. Create call ID: {callerIdShort}-{receiverIdShort}-call
3. Get or create call with members
4. Navigate to 'call' screen
```

---

## Theme & Design System

### Color Palette

```javascript
colors = {
  primary: '#BD00FF',     // Purple
  secondary: '#FF2C79',   // Pink
  tertiary: '#FF509D',    // Light Pink
  normal: '#2F80ED',      // Blue
  success: '#27C041',     // Green
  danger: '#FF2B1F',      // Red
  warning: '#FFD600',     // Yellow
  grey: '#9CA3AF',        // Default grey
  white: '#ffffff',
  gradientBG: '#62bdfa',  // Cyan
}
```

### Responsive Scaling

```javascript
moderateScale()    // Proportional scaling
verticalScale()    // Height-based scaling
horizontalScale()  // Width-based scaling
SCREEN_WIDTH       // Device width
SCREEN_HEIGHT      // Device height
```

---

## Key Features

### 1. Match Discovery (Home Screen)
- Stack of profile cards with swipe gestures
- **Swipe Left:** Dislike → `matchesService.unlikeProfile()`
- **Swipe Right:** Like → `matchesService.likeProfile()`
- **Swipe Up:** Open profile detail modal
- Profile info: Name, Age, Distance, Photos, Bio, Interests

### 2. Liked You
- Profiles that liked the current user
- Accept/decline matches

### 3. Real-time Messaging
- Two-way messaging with Stream Chat
- Online/offline status
- Unread message count
- Thread/reply support
- Read receipts

### 4. Video Calling
- Peer-to-peer video calls
- Ringing state with notifications
- Full video UI with controls

### 5. Profile Management
- Edit profile information
- Photo verification with camera
- Upload multiple photos
- GPS-based location
- Preferences management

### 6. Social Authentication
- Google Sign-In
- Apple Sign-In

---

## Dependencies

### Core
- `react` 19.0.0
- `react-native` 0.79.6

### Navigation
- `@react-navigation/native` 7.1.18
- `@react-navigation/bottom-tabs` 7.4.8
- `@react-navigation/native-stack` 7.3.27

### State Management
- `zustand` 5.0.8
- `jotai` 2.15.1
- `@tanstack/react-query` 5.90.2

### Stream SDKs
- `stream-chat` 9.26.0
- `stream-chat-react-native` 8.8.1
- `@stream-io/video-react-native-sdk` 1.24.7
- `@stream-io/react-native-webrtc` 137.0.0

### Storage
- `react-native-mmkv` 3.3.3

### UI & Animation
- `react-native-reanimated` 4.1.2
- `react-native-gesture-handler` 2.28.0
- `react-native-linear-gradient` 2.8.3

### Forms
- `formik` 2.4.6
- `yup` 1.7.1

### Authentication
- `@react-native-google-signin/google-signin` 16.1.1
- `@invertase/react-native-apple-authentication` 2.5.0

### Firebase
- `@react-native-firebase/app` 23.8.3
- `@react-native-firebase/messaging` 23.8.3
- `@notifee/react-native` 9.1.8

---

## Configuration Files

| File | Purpose |
|------|---------|
| `app.json` | App name and display configuration |
| `babel.config.js` | Babel preset and module resolvers |
| `metro.config.js` | Bundler configuration, SVG support |
| `index.js` | Entry point, registers root component |
| `package.json` | Dependencies and scripts |

---

## Data Flow

```
API Service Calls
    ↓
Request Interceptor (Add Auth Token)
    ↓
Backend (kikit-app.onrender.com)
    ↓
Response Interceptor (Handle Errors)
    ↓
React Query Cache
    ↓
Component State / Zustand Store
    ↓
UI Render
```

---

## Security Considerations

### Implemented
- Bearer token authentication
- MMKV encrypted storage
- JWT token-based sessions
- 401 error handling with logout
- Permission requests for camera/location

### Recommendations
- Move API keys to environment variables (.env)
- Implement token refresh mechanism
- Add rate limiting
- Enhanced input sanitization

---

## Recent Git History

1. Removed meer profile
2. Removed age calculation
3. Fixed chat message container spacing
4. Navigate unauthorized user to login
5. Updated verifications screen
6. Installed revenue cat
7. Apple auth implemented
8. Google auth tested and working
9. Audio/video calling tested

---

## Critical Files Reference

| File | Purpose |
|------|---------|
| `App.jsx` | Root app wrapper |
| `src/navigation/RootNavigator.js` | Auth/Main routing decision |
| `src/store/kitkitStore.js` | Global state |
| `src/api/interceptor.js` | API request/response handling |
| `src/screens/main/HomeScreen.jsx` | Swipe card discovery |
| `src/screens/stream/Chat.jsx` | Chat + video call trigger |
| `src/screens/stream/Call.jsx` | Active video call UI |
| `src/screens/stream/ChatProvider.jsx` | Stream chat init |
| `src/screens/stream/VideoProvider.jsx` | Stream video init |
| `src/components/Card.jsx` | Swipeable profile card |
| `src/theme/colors.js` | Design system colors |
