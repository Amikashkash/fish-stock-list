# Fish Farm Management System

A modern, mobile-first web application for managing fish farms built with React and Firebase.

## Features

- 🔐 **Secure Authentication**
  - Email/Password login and registration
  - Google Sign-In integration
  - Password reset functionality
  - Email verification

- 📱 **Mobile-First Design**
  - Responsive layout optimized for mobile devices
  - Touch-friendly interface
  - Fast and smooth animations

- 🐠 **Farm Management**
  - Multi-tenant architecture
  - User and farm management
  - Role-based access control

## Tech Stack

- **Frontend:** React 19 + Vite
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Routing:** React Router DOM
- **Styling:** CSS3 with CSS Variables

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Authentication and Firestore enabled

### Installation

1. Clone the repository
```bash
git clone https://github.com/Amikashkash/fish-stock-list.git
cd fish-stock-list
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your Firebase configuration:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase credentials:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Start the development server
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)

2. Enable Authentication methods:
   - Email/Password
   - Google Sign-In

3. Create a Firestore database

4. Set up Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /farms/{farmId} {
      allow read, write: if request.auth != null;
      match /members/{memberId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

## Project Structure

```
fish-stock-list/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable React components
│   ├── contexts/        # React Context providers
│   ├── firebase/        # Firebase configuration
│   ├── pages/           # Page components
│   ├── services/        # Business logic and API calls
│   ├── App.jsx          # Main app component
│   ├── App.css          # App styles
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── .env.example         # Environment variables template
├── .env.local          # Your environment variables (not committed)
├── .gitignore          # Git ignore rules
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
└── README.md           # This file
```

## Security

⚠️ **Important:** Never commit your `.env.local` file or any file containing Firebase credentials to git!

The `.gitignore` file is configured to exclude sensitive files.

## License

Private - All rights reserved

## Support

For issues or questions, please open an issue on GitHub.
