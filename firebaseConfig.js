import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Dữ liệu config của bạn
const firebaseConfig = {
  apiKey: "AIzaSyBxMCGJAa_v0sZtMMzqJj5yGZIQnMk_Icg",
  authDomain: "kiotviet-92ed5.firebaseapp.com",
  projectId: "kiotviet-92ed5",
  storageBucket: "kiotviet-92ed5.firebasestorage.app",
  messagingSenderId: "630705983109",
  appId: "1:630705983109:web:5541e49d1bc71c809223ec",
  measurementId: "G-CZTK0NR5J6"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Xuất ra các dịch vụ bạn cần dùng
export const auth = getAuth(app);
export const db = getFirestore(app);