import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
import { auth, db } from './firebaseConfig'; 
// SỬA LỖI MÀN HÌNH TRẮNG: Đảm bảo import cả Text
import { ActivityIndicator, View, Text } from 'react-native'; 

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hàm tải vai trò từ Firestore hoặc tạo Document User mới
  const fetchUserRole = async (user) => {
    if (!user) {
      setUserRole(null);
      return;
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const role = docSnap.data().role || 'staff'; 
        setUserRole(role);
      } else {
        // Tạo Document cho người dùng mới (Mặc định là staff)
        const defaultRole = 'staff';
        await setDoc(userRef, {
            email: user.email,
            role: defaultRole, 
            createdAt: new Date(),
        });
        setUserRole(defaultRole);
      }
    } catch (error) {
      console.error("[AuthContext] Error fetching or creating user role:", error);
      setUserRole('staff'); 
    }
  };


  useEffect(() => {
    setLoading(true); 
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserRole(user); 
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Đăng ký (Đơn giản hóa để onAuthStateChanged xử lý việc tạo Document users)
  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Đăng nhập
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Đăng xuất
  const logout = () => {
    setUserRole(null);
    return signOut(auth);
  };
  
  // Đổi mật khẩu (Cần xác thực lại bằng mật khẩu cũ)
  const changePassword = async (currentPassword, newPassword) => {
      const user = auth.currentUser;
      if (!user || !user.email) {
          throw new Error("Người dùng chưa đăng nhập.");
      }
      
      // 1. Tạo chứng chỉ xác thực lại
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      
      // 2. Xác thực lại người dùng
      await reauthenticateWithCredential(user, credential);
      
      // 3. Cập nhật mật khẩu mới
      await updatePassword(user, newPassword);
  };


  const value = {
    currentUser,
    loading,
    userRole, 
    isManager: userRole === 'admin',
    signup,
    login,
    logout,
    changePassword,
  };

  // Loading Screen (Đã thêm Text vào import để tránh lỗi)
  if (loading) {
      return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={{marginTop: 10, color: '#007AFF'}}>Đang tải dữ liệu...</Text>
          </View>
      );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
