import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDz3Z2Dg3O6yCVJ2SfL2rcF71V4FT6iXuU",
  authDomain: "sahaba-saif.firebaseapp.com",
  projectId: "sahaba-saif",
  storageBucket: "sahaba-saif.firebasestorage.app",
  messagingSenderId: "796024911004",
  appId: "1:796024911004:web:76438be8ad163b1da2a959"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);