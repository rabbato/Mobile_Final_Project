import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB8gsWnAdRRIlx3glTrsd9_p0lqGxYU3jQ",
  authDomain: "parkingspotreserve.firebaseapp.com",
  projectId: "parkingspotreserve",
  storageBucket: "parkingspotreserve.firebasestorage.app",
  messagingSenderId: "99094367117",
  appId: "1:99094367117:web:df987daef7fe46e3ed8bc4",
  measurementId: "G-J3C9BT1H0M"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);