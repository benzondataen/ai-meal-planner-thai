import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// These constants are also used by the Firestore REST service
export const FIREBASE_PROJECT_ID = "ai-meal-planner-3f494";
export const FIREBASE_API_KEY = "AIzaSyAhBHFITpjjkirkwP_EY1UsYHPE2Y_9v_8";

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "ai-meal-planner-3f494.firebaseapp.com",
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: "ai-meal-planner-3f494.appspot.com",
  messagingSenderId: "248788940050",
  appId: "1:248788940050:web:6b05eac2f5512947d6efcb",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);