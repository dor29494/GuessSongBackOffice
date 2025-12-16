# GuessSong Backoffice

A React-based backoffice application for GuessSong with Firebase Authentication.

## Features

- Firebase Authentication with Email/Password and Google Sign-in
- Protected routes for authenticated users only
- Modern UI with gradient design
- Responsive layout

## Prerequisites

- Node.js 20.x or higher
- npm
- Firebase project (https://console.firebase.google.com/)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

The Firebase configuration is already set up in `src/config/firebase.js`. Make sure you have:

1. **Enabled Email/Password Authentication:**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable **Email/Password** provider
   - Click "Save"

2. **Add Authorized Users:**
   - Go to Firebase Console → Authentication → Users
   - Click "Add user"
   - Enter email and password for authorized users
   - Only users you manually add can access the backoffice

3. **(Optional) Enable Google Sign-in:**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable **Google** provider
   - Follow the setup instructions

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## Usage

### Adding New Users

To add a new user who can access the backoffice:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **guesssong-7e16b**
3. Go to **Authentication** → **Users**
4. Click **Add user**
5. Enter the email and password
6. Click **Add user**

The new user can now log in to the backoffice with their credentials.

### Removing Users

1. Go to Firebase Console → Authentication → Users
2. Find the user you want to remove
3. Click the three dots menu → **Delete user**

## Project Structure

```
src/
├── components/       # React components
│   └── ProtectedRoute.jsx
├── config/          # Configuration files
│   └── firebase.js
├── contexts/        # React contexts
│   └── AuthContext.jsx
├── pages/           # Page components
│   ├── Login.jsx
│   ├── Login.css
│   ├── Dashboard.jsx
│   └── Dashboard.css
├── services/        # API services
│   └── api.js
├── App.jsx          # Main app component
└── main.jsx         # Entry point
```

## Authentication Flow

1. User navigates to the app
2. If not authenticated, redirected to `/login`
3. User can sign in with:
   - Email/Password (for users added in Firebase Console)
   - Google Sign-in (if enabled)
4. Upon successful authentication, redirected to `/dashboard`
5. Protected routes check authentication status
6. User can logout from the dashboard

## Technologies Used

- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Firebase Authentication** - User authentication
- **Axios** - HTTP client (for future API calls)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Security Notes

- Never commit Firebase configuration with sensitive keys to public repositories
- Use Firebase security rules to protect your data
- Regularly review authorized users in Firebase Console
- Consider implementing additional security features like 2FA for production
