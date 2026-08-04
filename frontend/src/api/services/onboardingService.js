import {api} from '../interceptor';

export const onboardingService = {
  // Email OTP methods
  createUser: userData => api.post('users/signup/', userData),
  loginUser: userData => api.post('users/login/', userData),
  verifyEmailOTP: payload => api.post('otp/verify/', payload),
  resendOTP: payload => api.post('otp/resend/', payload),
  
  // Phone OTP methods (using same endpoints with service: 'phone')
  sendPhoneOTP: payload => api.post('phone-verification/send/', payload),
  verifyPhoneOTP: payload => api.post('otp/verify/', payload),
  checkPhoneNumber: payload => api.post('phone-verification/check/', payload),
  
  // Social auth methods
  appleAuth: payload => api.post('auth/apple/', payload),
  googleAuth: payload => api.post('auth/google/', payload),
};
