// OAuth Configuration for different environments
const getOAuthConfig = () => {
  const currentOrigin = window.location.origin;
  const isDevelopment = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
  
  // Check for environment-specific redirect URI
  const envRedirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  
  if (envRedirectUri) {
    return {
      redirectUri: envRedirectUri,
      uxMode: isDevelopment ? 'popup' : 'redirect'
    };
  }
  
  // Development environment
  if (isDevelopment) {
    return {
      redirectUri: 'http://localhost:5173',
      uxMode: 'popup' // Use popup for development
    };
  }
  
  // Production environment
  return {
    redirectUri: currentOrigin,
    uxMode: 'redirect' // Use redirect for production to avoid COOP issues
  };
};

export default getOAuthConfig; 