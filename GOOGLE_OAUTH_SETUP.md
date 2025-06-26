# Google OAuth Setup and Troubleshooting Guide

## Overview
This guide helps you set up Google OAuth for the Housemate application and troubleshoot common issues like `redirect_uri_mismatch`.

## Setup Instructions

### 1. Google Cloud Console Configuration

1. **Go to Google Cloud Console**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project or create a new one

2. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"

4. **Configure Authorized Redirect URIs**:
   Add ALL your domains to the "Authorized redirect URIs" section:

   ```
   # Development
   http://localhost:5173
   http://localhost:3000
   http://127.0.0.1:5173
   http://127.0.0.1:3000

   # Production (replace with your actual domains)
   https://yourdomain.com
   https://www.yourdomain.com
   https://your-app.vercel.app
   https://your-app.netlify.app
   https://your-app.onrender.com
   ```

5. **Copy Client ID**:
   - Copy the generated Client ID
   - Add it to your environment variables as `VITE_GOOGLE_CLIENT_ID`

### 2. Environment Variables

Create a `.env` file in your frontend directory:

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_REDIRECT_URI=https://yourdomain.com  # Optional: override default

# Backend URL
VITE_BACKEND_URL=https://your-backend-domain.com
```

### 3. Backend Configuration

Make sure your backend has the Google Client ID configured:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
JWT_SECRET=your_jwt_secret_here
```

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URI in your Google Cloud Console doesn't match your application's domain.

**Solutions**:

1. **Check Current Domain**:
   - Open browser console and run: `console.log(window.location.origin)`
   - Add this exact URL to Google Cloud Console

2. **Update Google Cloud Console**:
   - Go to Google Cloud Console > Credentials
   - Edit your OAuth 2.0 Client ID
   - Add your current domain to "Authorized redirect URIs"

3. **Environment-Specific URIs**:
   - Add both development and production URLs
   - Include all subdomains (www, non-www)

### Error: "Cross-Origin-Opener-Policy policy would block the window.closed call"

**Cause**: Modern browsers block popup window access for security.

**Solutions**:

1. **Use Redirect Flow** (Recommended):
   - The application now automatically uses redirect flow in production
   - Popup flow is only used in development

2. **Update Headers**:
   - Add COOP headers to your server configuration
   - For Vercel, add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin-allow-popups"
        }
      ]
    }
  ]
}
```

### Error: "popup_closed_by_user"

**Cause**: User closed the OAuth popup window.

**Solution**: 
- This is normal user behavior
- The application shows a friendly message asking to try again

### Error: "invalid_client"

**Cause**: Incorrect or missing Google Client ID.

**Solutions**:

1. **Check Environment Variables**:
   - Verify `VITE_GOOGLE_CLIENT_ID` is set correctly
   - Restart your development server after changes

2. **Verify Client ID**:
   - Copy the exact Client ID from Google Cloud Console
   - Make sure there are no extra spaces or characters

## Testing

### Development Testing

1. **Local Testing**:
   ```bash
   npm run dev
   ```
   - Visit `http://localhost:5173`
   - Test Google sign-in

2. **Check Console**:
   - Open browser developer tools
   - Look for any OAuth-related errors
   - Verify redirect URI matches

### Production Testing

1. **Deploy and Test**:
   - Deploy to your production domain
   - Test Google sign-in on production
   - Verify redirect URI is added to Google Cloud Console

2. **Monitor Errors**:
   - Check browser console for errors
   - Monitor server logs for OAuth issues

## Common Domains to Add

Based on your deployment platforms, add these to Google Cloud Console:

```
# Vercel
https://your-app.vercel.app
https://your-app-git-main.vercel.app

# Netlify
https://your-app.netlify.app
https://your-app.netlify.com

# Render
https://your-app.onrender.com

# Custom Domain
https://yourdomain.com
https://www.yourdomain.com
```

## Security Best Practices

1. **Environment Variables**:
   - Never commit Client IDs to version control
   - Use environment variables for all sensitive data

2. **HTTPS Only**:
   - Always use HTTPS in production
   - Google OAuth requires HTTPS for production domains

3. **Regular Updates**:
   - Keep Google OAuth library updated
   - Monitor Google Cloud Console for any changes

## Support

If you continue to experience issues:

1. **Check Google Cloud Console** for any error messages
2. **Verify all redirect URIs** are correctly configured
3. **Test with different browsers** to isolate browser-specific issues
4. **Check network tab** in browser dev tools for failed requests 