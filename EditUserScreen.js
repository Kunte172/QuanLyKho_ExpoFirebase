import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView,
  StatusBar, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig'; 
import { useAuth } from './AuthContext';

export default function EditUserScreen({ route, navigation }) {
  // Lấy thông tin người dùng từ ManageUsersScreen
  const { userId, email, role } = route.params;
  const { isManager } = useAuth();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- 1. CHỨC NĂNG ĐỔI MẬT KHẨU ---
  const handleUpdatePassword = () => {
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    
    // Yêu cầu Cloud Function (Admin SDK) để đổi mật khẩu người khác. 
    // Chúng ta chỉ giả lập Alert ở đây.
    Alert.alert(
      "Yêu cầu Admin SDK", 
      `Yêu cầu đổi mật khẩu cho ${email} đã được gửi. Lưu ý: Chức năng này đòi hỏi Firebase Admin SDK (Cloud Functions) và không thể thực hiện trực tiếp từ ứng dụng di động.`,
      [{ text: "OK", onPress: navigation.goBack }]
    );
  };
  
  // --- 2. CHỨC NĂNG XÓA TÀI KHOẢN ---
  const handleDeleteUser = async () => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn XÓA tài khoản ${email} (Vai trò: ${role.toUpperCase()})? Hành động này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive", 
          onPress: async () => {
            setIsLoading(true);
            try {
              // 1. Xóa document user trong Firestore (Bắt buộc)
              const userDocRef = doc(db, 'users', userId);
              await deleteDoc(userDocRef);
              
              // 2. Xóa tài khoản trong Firebase Auth (Cần Admin SDK/Cloud Function)
              // Ta sẽ giả lập thành công xóa user Auth sau khi xóa Firestore.

              Alert.alert('Thành công', `Đã xóa tài khoản ${email}. Lưu ý: Cần Cloud Function để xóa tài khoản trong Firebase Auth.`);
              navigation.goBack(); 

            } catch (error) {
              console.error("Lỗi xóa tài khoản:", error);
              Alert.alert('Lỗi', 'Không thể xóa người dùng khỏi Firestore.');
            } finally {
              setIsLoading(false);
            }
          }
        },
      ]
    );
  };

  // Kiểm tra quyền truy cập (Admin phải là người duy nhất)
  if (!isManager) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Bạn không có quyền truy cập màn hình này.</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading} style={styles.backButton}>
             <Ionicons name="chevron-back-outline" size={32} color={isLoading ? '#AAA' : '#007AFF'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sửa User: {email}</Text>
          <View style={{ width: 32 }} /> 
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Thông tin User */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{email}</Text>
            <Text style={styles.infoLabel}>Vai trò hiện tại:</Text>
            <Text style={styles.infoValue}>{role.toUpperCase()}</Text>
          </View>
          
          {/* ĐỔI MẬT KHẨU CHO USER KHÁC */}
          <Text style={styles.sectionTitle}>ĐỔI MẬT KHẨU</Text>
          <View style={styles.form}>
             <Text style={styles.label}>Mật khẩu mới *</Text>
             <TextInput
               style={styles.input}
               value={newPassword}
               onChangeText={setNewPassword}
               secureTextEntry
               placeholder="Ít nhất 6 ký tự"
               editable={!isLoading}
             />

             <Text style={styles.label}>Xác nhận mật khẩu mới *</Text>
             <TextInput
               style={styles.input}
               value={confirmPassword}
               onChangeText={setConfirmPassword}
               secureTextEntry
               placeholder="Nhập lại mật khẩu mới"
               editable={!isLoading}
             />

             <TouchableOpacity
               style={[styles.buttonContainer, isLoading && styles.buttonDisabled]}
               onPress={handleUpdatePassword}
               disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
             >
               {isLoading ? (
                 <ActivityIndicator size="small" color="#FFFFFF" />
               ) : (
                 <Text style={styles.buttonText}>Đổi mật khẩu cho {role.toUpperCase()}</Text>
               )}
             </TouchableOpacity>
          </View>

          {/* XÓA TÀI KHOẢN */}
          <Text style={styles.sectionTitle}>KHÁC</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteUser} disabled={isLoading}>
            <Text style={styles.deleteButtonText}>Xóa tài khoản này</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', flex: 1, marginHorizontal: 5 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 20 },
  errorText: { textAlign: 'center', marginTop: 50, color: '#FF3B30', fontSize: 16 },
  
  infoCard: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#DDD'},
  infoLabel: { fontSize: 14, color: '#666', marginTop: 8 },
  infoValue: { fontSize: 16, fontWeight: '500', color: '#333' },

  sectionTitle: { fontSize: 14, color: '#666', fontWeight: '500', marginTop: 20, marginBottom: 10 },
  form: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, },
  label: { fontSize: 15, fontWeight: '500', color: '#333', marginBottom: 6, marginTop: 15 },
  input: { height: 50, backgroundColor: '#FFFFFF', borderColor: '#DDD', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  buttonContainer: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 10, marginTop: 30, alignItems: 'center', justifyContent: 'center', height: 50 },
  buttonDisabled: { backgroundColor: '#A9A9A9' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  
  deleteButton: { marginTop: 20, backgroundColor: '#FF3B30', paddingVertical: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', height: 50 },
  deleteButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
