// OAuth Configuration for different environments
const getOAuthConfig = () => {
  const currentOrigin = window.location.origin;
  const isDevelopment =
    currentOrigin.includes("localhost") || currentOrigin.includes("127.0.0.1");

  // Check for environment-specific redirect URI
  const envRedirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

  // Development environment
  if (isDevelopment) {
    const devRedirectUri = envRedirectUri || "http://localhost:5173";
    console.log("Using development redirect URI:", devRedirectUri);
    return {
      redirectUri: devRedirectUri,
      uxMode: "popup", // Use popup for development
    };
  }

  // Production environment - use the current origin as-is
  const productionRedirectUri = currentOrigin;

  console.log("Using production redirect URI:", productionRedirectUri);
  console.log("Current origin:", currentOrigin);
  console.log("Environment redirect URI:", envRedirectUri);

  return {
    redirectUri: productionRedirectUri, // Use current origin in production
    uxMode: "popup", // Use popup for production to avoid COOP issues
  };
};

export default getOAuthConfig;
