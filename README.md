# Home Workout App - Admin Dashboard

This is the admin dashboard for the Home Workout App, built with Vue.js and Firebase.

## Features

- Admin authentication with Firebase Auth
- Secure admin-only access
- CRUD operations for:
  - Main Categories
  - Sub Categories
  - Difficulty Levels
  - Workout Plans
  - Exercises
  - User Management

## Prerequisites

- Node.js 16+
- npm or yarn
- Firebase project with Firestore, Authentication, and Storage enabled

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure Firebase:
   - Update the Firebase configuration in `src/firebase/config.js` with your Firebase project credentials

4. Set up an admin user:
   - Create a user in Firebase Authentication
   - The admin check is currently based on email (`admin@example.com`) - update it in `src/main.js` or implement a more robust solution as needed

## Development

```
npm run dev
```

## Production Build

```
npm run build
```

## Usage

1. Log in with your admin credentials
2. Use the sidebar navigation to manage different aspects of your workout app
3. All changes are directly synchronized with Firebase

## Folder Structure

```
vue-app/
├── public/                 # Static assets
├── src/
│   ├── assets/             # CSS and other assets
│   ├── components/         # Reusable Vue components
│   ├── firebase/           # Firebase configuration
│   │   └── config.js       # Firebase setup
│   ├── views/              # Page components
│   │   ├── Login.vue       # Login page
│   │   ├── AdminDashboard.vue  # Admin dashboard layout
│   │   └── admin/          # Admin section components
│   │       ├── MainCategories.vue
│   │       ├── SubCategories.vue
│   │       └── ...
│   ├── App.vue             # Root component
│   └── main.js             # Application entry point
└── package.json            # Project dependencies
```

## Security Notes

- Make sure to set up proper Firestore security rules to restrict access to admin users only
- Consider implementing more robust admin verification mechanisms
