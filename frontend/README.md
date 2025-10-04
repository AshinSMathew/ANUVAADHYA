# अनुवाद्य - Subtitle Generation Platform

A modern, sleek subtitle generation platform with authentication and forgery detection capabilities.

## Features

### Authentication System
- **User Registration & Login**: Firebase-powered authentication
- **Role-based Access**: Two user types - `user` and `production`
- **Protected Routes**: Secure access to different features based on user role

### User Features
- Create and manage subtitle projects
- Modern, animated UI with black/white cinema aesthetic
- Responsive design with smooth animations

### Production Features
- All user features plus:
- **Forgery Detection**: Upload files to detect potential tampering
- Advanced file analysis capabilities
- Detailed reporting system

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom animations
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Setup Instructions

### 1. Firebase Configuration

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Get your Firebase config from Project Settings
5. Update `frontend/lib/firebase.ts` with your Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/
│   ├── dashboard/          # Main dashboard
│   ├── login/             # Login page
│   ├── signup/            # Registration page
│   ├── forgery-detection/ # Production-only feature
│   └── page.tsx           # Landing page
├── components/
│   └── ProtectedRoute.tsx # Route protection component
├── contexts/
│   └── AuthContext.tsx    # Authentication context
├── lib/
│   └── firebase.ts        # Firebase configuration
└── public/                # Static assets
```

## User Roles

### User
- Create subtitle projects
- Manage personal projects
- Basic dashboard access

### Production
- All user features
- Forgery detection tools
- Advanced file analysis
- Detailed reporting

## Design Features

- **Black/White Cinema Aesthetic**: Modern, sleek design
- **Smooth Animations**: Framer Motion powered transitions
- **Glassmorphic Effects**: Modern UI elements
- **Responsive Design**: Works on all device sizes
- **Floating Particles**: Dynamic background elements
- **Role-based UI**: Different interfaces for different user types

## Development

The project uses:
- TypeScript for type safety
- Tailwind CSS for styling
- Framer Motion for animations
- Firebase for backend services
- Next.js App Router for routing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.