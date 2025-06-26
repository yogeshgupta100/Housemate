import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GoogleOAuthProviderWrapper = ({ children }) => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.warn('Google Client ID not found. Please set VITE_GOOGLE_CLIENT_ID in your environment variables.');
    return children;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {children}
    </GoogleOAuthProvider>
  );
};

export default GoogleOAuthProviderWrapper; 