// OAuth Configuration for different environments
const getOAuthConfig = () => {
  const currentOrigin = window.location.origin;
  const isDevelopment =
    currentOrigin.includes("localhost") || currentOrigin.includes("127.0.0.1");

  // Check for environment-specific redirect URI
  let envRedirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

  // Always ensure the redirectUri ends with /auth/callback
  if (envRedirectUri) {
    if (!envRedirectUri.endsWith("/auth/callback")) {
      // Remove trailing slash if present, then append /auth/callback
      envRedirectUri = envRedirectUri.replace(/\/?$/, "") + "/auth/callback";
    }
    console.log("Using environment redirect URI:", envRedirectUri);
    return {
      redirectUri: envRedirectUri,
      uxMode: "popup", // Use popup for both dev and prod to avoid redirect issues
    };
  }

  // Development environment
  if (isDevelopment) {
    const devRedirectUri = "http://localhost:5173/auth/callback";
    console.log("Using development redirect URI:", devRedirectUri);
    return {
      redirectUri: devRedirectUri,
      uxMode: "popup", // Use popup for development
    };
  }

  // Production environment - use popup mode to avoid redirect issues
  const productionRedirectUri = `${currentOrigin}/auth/callback`;
  console.log("Using production redirect URI:", productionRedirectUri);
  return {
    redirectUri: productionRedirectUri,
    uxMode: "popup", // Use popup for production to avoid COOP issues
  };
};

export default getOAuthConfig;
