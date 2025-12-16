# Firebase Setup Guide

This guide will help you complete the Firebase setup for your GuessSong Backoffice application.

## Important: Enable Email/Password Authentication

You mentioned you enabled Google Sign-in, but for a controlled user list, you **must also enable Email/Password authentication**.

### Step-by-Step Instructions:

1. **Go to Firebase Console**
   - Open https://console.firebase.google.com/
   - Select your project: **guesssong-7e16b**

2. **Navigate to Authentication**
   - Click on **Build** in the left sidebar
   - Click on **Authentication**
   - Click on the **Sign-in method** tab

3. **Enable Email/Password Provider**
   - Look for **Email/Password** in the list of providers
   - Click on it
   - Toggle the **Enable** switch to ON
   - Click **Save**

4. **Add Your First User**
   - Go to the **Users** tab
   - Click **Add user** button
   - Enter:
     - **Email**: Your email address
     - **Password**: A secure password
   - Click **Add user**

## Authentication Methods Comparison

### Email/Password (Recommended for Backoffice)
- You manually add each user in Firebase Console
- Full control over who can access
- Each user has their own email/password
- Perfect for internal team access

### Google Sign-in (Already Enabled)
- Users sign in with their Google account
- You can still control access by:
  - Only whitelisting specific Google accounts
  - Adding additional checks in your code

## Using Both Methods

Your app now supports both:
1. **Email/Password** - For users you manually add
2. **Google Sign-in** - For quick access with Google accounts

### To Restrict Google Sign-in to Specific Users:

If you want to allow only specific Google accounts, you'll need to:

1. Create an allowlist in Firebase (using Firestore or Realtime Database)
2. After Google login, check if the user's email is in the allowlist
3. Deny access if not in the allowlist

Would you like me to implement this restriction?

## Testing the Application

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open http://localhost:5173**

3. **Try logging in with:**
   - The email/password user you created in Firebase
   - OR click "Sign In with Google" to use your Google account

## Managing Users

### Adding New Users (Email/Password)
1. Firebase Console → Authentication → Users
2. Click "Add user"
3. Enter email and password
4. User can now log in

### Viewing All Users
- Firebase Console → Authentication → Users
- You'll see all registered users (both email/password and Google)

### Removing Users
1. Find the user in the Users list
2. Click the three dots (⋮)
3. Click "Delete user"

## Security Best Practices

1. **Enable Email Verification** (Optional but recommended):
   - Makes users verify their email address
   - Go to Authentication → Settings → Email verification

2. **Set Password Requirements**:
   - Firebase enforces minimum 6 characters by default
   - For stronger security, educate users to use longer passwords

3. **Monitor Authentication Activity**:
   - Check Firebase Console → Authentication regularly
   - Remove inactive or suspicious accounts

## Troubleshooting

### "auth/operation-not-allowed" Error
- Make sure Email/Password provider is enabled in Firebase Console

### "auth/invalid-credential" Error
- Wrong email or password
- Make sure the user exists in Firebase Console

### Google Sign-in Opens But Fails
- Check that your domain is authorized in Firebase Console
- Go to Authentication → Settings → Authorized domains
- Add `localhost` for development

## Next Steps

After authentication is working:

1. Enable email verification for added security
2. Set up custom claims for role-based access (admin, editor, viewer)
3. Add password reset functionality
4. Implement activity logging

Need help with any of these? Just ask!
