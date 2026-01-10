// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
// };

// const app = initializeApp(firebaseConfig);
// export const db = getFirestore(app);

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDnBlhUu_-kyn0tvPvPL96NDb7k3vfjaBA",
  authDomain: "sitarahub-7fbaf.firebaseapp.com",
  projectId: "sitarahub-7fbaf",
  storageBucket: "sitarahub-7fbaf.firebasestorage.app",
  messagingSenderId: "217338211214",
  appId: "1:217338211214:web:a0d6645901d3ebe23cd2df",
  measurementId: "G-8L0LW93R3X",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };
