import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "asterauthen.firebaseapp.com",
  projectId: "asterauthen",
  storageBucket: "asterauthen.firebasestorage.app",
  messagingSenderId: "91749717332",
  appId: "G-H6KCPD18YS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);