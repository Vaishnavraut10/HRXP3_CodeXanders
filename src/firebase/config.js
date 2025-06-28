import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: 'AIzaSyDgD-QSY-qrN4tzMvG65Hx8B5A-3CxYyXc',
  authDomain: 'byod-access.firebaseapp.com',
  projectId: 'byod-access',
   storageBucket: 'byod-access.firebasestorage.app',
  appId: '1:245262456480:web:564820f67e3108e8801bc5',
  messagingSenderId: "245262456480",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };