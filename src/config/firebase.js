import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAXgdi4F0GVlzvYR5iOc7uBRKajUMF3jnc",
  authDomain: "guesssong-7e16b.firebaseapp.com",
  projectId: "guesssong-7e16b",
  storageBucket: "guesssong-7e16b.firebasestorage.app",
  messagingSenderId: "829627243632",
  appId: "1:829627243632:web:fcefc9fa59b6ff032468b5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export default app;
