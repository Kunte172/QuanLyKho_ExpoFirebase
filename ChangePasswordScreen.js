import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView,
  StatusBar, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';

export default function ChangePasswordScreen({ navigation }) {
  const { currentUser, changePassword } = useAuth();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới và mật khẩu xác nhận không khớp.');
      return;
    }
    
    setIsLoading(true);

    try {
      // Gọi hàm changePassword từ AuthContext (hàm này sẽ tự động reauthenticate)
      await changePassword(oldPassword, newPassword);
      
      Alert.alert('Thành công', 'Mật khẩu của bạn đã được thay đổi.');
      navigation.goBack(); 

    } catch (error) {
      let errorMessage = 'Đã xảy ra lỗi không xác định.';

      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Mật khẩu hiện tại không chính xác. Vui lòng thử lại.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất và đăng nhập lại trước khi đổi mật khẩu.';
      } else if (error.code === 'auth/weak-password') {
         errorMessage = 'Mật khẩu quá yếu (cần ít nhất 6 ký tự).';
      } else {
        console.error("Change Password Error:", error.code, error.message);
      }
      
      Alert.alert('Đổi mật khẩu thất bại', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
          <View style={{ width: 32 }} /> {/* Spacer */}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.infoText}>
             Để đảm bảo bảo mật, bạn cần xác nhận mật khẩu hiện tại trước khi thiết lập mật khẩu mới.
          </Text>

          <View style={styles.form}>
             {/* Mật khẩu hiện tại */}
             <Text style={styles.label}>Mật khẩu hiện tại *</Text>
             <TextInput
               style={styles.input}
               value={oldPassword}
               onChangeText={setOldPassword}
               secureTextEntry
               placeholder="Nhập mật khẩu hiện tại"
               editable={!isLoading}
             />

             {/* Mật khẩu mới */}
             <Text style={styles.label}>Mật khẩu mới *</Text>
             <TextInput
               style={styles.input}
               value={newPassword}
               onChangeText={setNewPassword}
               secureTextEntry
               placeholder="Ít nhất 6 ký tự"
               editable={!isLoading}
             />

             {/* Xác nhận mật khẩu */}
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
               onPress={handleChangePassword}
               disabled={isLoading}
             >
               {isLoading ? (
                 <ActivityIndicator size="small" color="#FFFFFF" />
               ) : (
                 <Text style={styles.buttonText}>Cập nhật mật khẩu</Text>
               )}
             </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 20 },
  infoText: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  form: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, },
  label: { fontSize: 15, fontWeight: '500', color: '#333', marginBottom: 6, marginTop: 15 },
  input: { height: 50, backgroundColor: '#FFFFFF', borderColor: '#DDD', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  buttonContainer: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 10, marginTop: 30, alignItems: 'center', justifyContent: 'center', height: 50 },
  buttonDisabled: { backgroundColor: '#A9A9A9' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
