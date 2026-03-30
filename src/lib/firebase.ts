// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD_B7CZFtz8T3_-tMDS0oBmYhTxEydr6RA",
  authDomain: "groww-65740.firebaseapp.com",
  projectId: "groww-65740",
  storageBucket: "groww-65740.firebasestorage.app",
  messagingSenderId: "338746465654",
  appId: "1:338746465654:web:3afd70a9aa625c354eae57",
  measurementId: "G-Q0P8MJP56K",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);