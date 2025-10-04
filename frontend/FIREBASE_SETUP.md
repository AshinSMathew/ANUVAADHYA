# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or "Add project"
3. Enter project name: `cinehack-auth` (or your preferred name)
4. Enable Google Analytics (optional)
5. Choose Analytics account (optional)
6. Click "Create project"

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Email/Password**
3. Toggle **Enable** to ON
4. Click **Save**

## 3. Set up Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we'll update rules later)
4. Select a location (choose closest to your users)
5. Click **Done**

## 4. Configure Firestore Security Rules

1. Go to **Firestore Database** > **Rules**
2. Replace the default rules with the content from `firestore.rules` file
3. Click **Publish**

## 5. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Web app** icon (`</>`)
4. Register app with nickname: `cinehack-web`
5. Copy the config object

## 6. Set up Environment Variables

Create `.env.local` file in the `frontend` directory:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 7. Deploy Security Rules (Optional)

If you want to deploy rules via CLI:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

## 8. Test Authentication

1. Start the development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Try creating an account with both user types
4. Test login/logout functionality
5. Verify session persistence across page refreshes

## Security Features Implemented

### Cookie-based Session Management
- **Secure Cookies**: HttpOnly, Secure, SameSite=strict
- **Token Expiry**: 7-day cookie expiry with auto-refresh
- **Session Validation**: Automatic token validation and refresh
- **Auto-logout**: Automatic logout on token expiry

### Firestore Security Rules
- **User Data Protection**: Users can only access their own data
- **Role-based Access**: Production users have additional permissions
- **Data Validation**: Strict validation for all document writes
- **Admin Access**: Production users can access admin features

### Authentication Flow
1. **Signup**: Creates user account + Firestore document + secure cookie
2. **Login**: Validates credentials + sets secure cookie + updates last login
3. **Session Persistence**: Cookie-based session across browser refreshes
4. **Auto-refresh**: Tokens refresh automatically every 50 minutes
5. **Logout**: Clears all session data and cookies

## Database Structure

```
users/{userId}
├── role: 'user' | 'production'
├── displayName: string
├── email: string
├── createdAt: timestamp
└── lastLoginAt: timestamp

projects/{projectId}
├── userId: string
├── title: string
├── status: 'draft' | 'processing' | 'completed' | 'failed'
└── createdAt: timestamp

forgery_results/{resultId}
├── userId: string (production only)
├── fileName: string
├── analysisDate: timestamp
└── results: object

uploads/{uploadId}
├── userId: string
├── fileName: string
├── fileType: string
├── uploadDate: timestamp
└── status: 'uploading' | 'completed' | 'failed'
```

## Troubleshooting

### Common Issues

1. **"Firebase: Error (auth/invalid-api-key)"**
   - Check your `.env.local` file has correct API key
   - Ensure environment variables are prefixed with `NEXT_PUBLIC_`

2. **"Firebase: Error (auth/email-already-in-use)"**
   - User already exists, try logging in instead

3. **"Firebase: Error (auth/weak-password)"**
   - Password must be at least 6 characters

4. **"Firebase: Error (auth/user-not-found)"**
   - User doesn't exist, try signing up first

5. **Session not persisting**
   - Check browser cookies are enabled
   - Verify cookie settings in `auth-utils.ts`

### Debug Mode

Enable Firebase debug logging:

```javascript
// Add to your app initialization
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';

if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

## Production Deployment

1. **Environment Variables**: Set production environment variables
2. **Domain Configuration**: Add your domain to Firebase Auth settings
3. **Security Rules**: Deploy production security rules
4. **Monitoring**: Enable Firebase Performance Monitoring
5. **Analytics**: Configure Firebase Analytics for user insights

## Monitoring

- **Authentication Logs**: Monitor in Firebase Console > Authentication > Users
- **Firestore Usage**: Check in Firebase Console > Firestore > Usage
- **Performance**: Monitor in Firebase Console > Performance
- **Errors**: Check browser console and Firebase Console > Crashlytics
