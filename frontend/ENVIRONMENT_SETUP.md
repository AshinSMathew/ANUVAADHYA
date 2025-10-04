# Environment Setup

## Required Environment Variables

Create a `.env.local` file in the `frontend` directory with the following variables:

```bash
# Firebase Configuration
# Get these values from your Firebase project settings
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## How to Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one)
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on the web app icon (`</>`)
6. Register your app with a nickname
7. Copy the config object values to your `.env.local` file

## Firebase Setup Steps

### 1. Enable Authentication
1. Go to Authentication > Sign-in method
2. Enable "Email/Password" provider
3. Optionally enable "Email link (passwordless sign-in)"

### 2. Set up Firestore Database
1. Go to Firestore Database
2. Create database in production mode
3. Choose a location (preferably close to your users)
4. Copy the security rules from `firestore.rules` file

### 3. Deploy Security Rules
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore`
4. Deploy rules: `firebase deploy --only firestore:rules`

### 4. Configure Storage (Optional)
1. Go to Storage
2. Get started with default rules
3. Update rules if needed for file uploads

## Security Notes

- Never commit `.env.local` to version control
- Use different Firebase projects for development and production
- Regularly rotate API keys
- Monitor authentication logs in Firebase Console
