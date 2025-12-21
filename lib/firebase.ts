import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAJ5uAYDfRb30CQ3za0J7LoOTfCM52-5bQ",
    authDomain: "muscle-gym-app-4852c.firebaseapp.com",
    projectId: "muscle-gym-app-4852c",
    storageBucket: "muscle-gym-app-4852c.appspot.com",
    messagingSenderId: "708523603340",
    appId: "1:708523603340:web:0ffd7e3d376bf24feb52a9",
};

const app = initializeApp(firebaseConfig);

// 🔥 DIŞARI AKTARIMLAR (EXPORT)
export const auth = getAuth(app);
export const db = getFirestore(app); // İşte bu satırı ekledik, artık hata vermeyecek!
