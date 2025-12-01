import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC76Pmn9rvw2GOTcRWk2u9J22EuD4gTjk4",
  authDomain: "cloud0924.firebaseapp.com",
  databaseURL: "https://cloud0924-default-rtdb.firebaseio.com",
  projectId: "cloud0924",
  storageBucket: "cloud0924.appspot.com",
  messagingSenderId: "587763029124",
  appId: "1:587763029124:web:02e0c870663aca7b6f9ed1",
  measurementId: "G-X0PBZFJPLM"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);