import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';

// Import hook useAuth từ AuthContext
import { useAuth } from './AuthContext';

// Logo (đảm bảo đường dẫn đúng)
const logo = require('./assets/kiotviet-logo.png');

// Đảm bảo có export default và nhận navigation
export default function SignUpScreen({ navigation }) {
  // Lấy hàm signup từ Context
  const { signup } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Hàm xử lý Đăng ký
  const handleSignUp = async () => {
    // 1. Kiểm tra đầu vào
    if (!email || !password || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    if (password.length < 6) {
       Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự.');
       return;
    }

    setIsLoading(true);

    try {
      // 2. Gọi hàm signup từ AuthContext
      await signup(email, password);
      // Đăng ký thành công, tự động chuyển hướng

    } catch (error) {
      // 3. Bắt lỗi từ Firebase
      let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Địa chỉ email này đã được sử dụng.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Địa chỉ email không hợp lệ.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Mật khẩu quá yếu (cần ít nhất 6 ký tự).';
      }
      console.error("Signup Error:", error.code, error.message);
      Alert.alert('Đăng ký thất bại', errorMessage);
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu (ít nhất 6 ký tự)"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Xác nhận mật khẩu"
            placeholderTextColor="#888"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.buttonContainer, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backButton: { position: 'absolute', top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 60, left: 15, zIndex: 1, padding: 10 },
  backButtonText: { color: '#007AFF', fontSize: 16 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  logo: { width: 180, height: 60, alignSelf: 'center', marginBottom: 50 },
  input: { height: 50, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 16, fontSize: 16 },
  buttonContainer: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 10, marginTop: 20, alignItems: 'center', justifyContent: 'center', height: 50 },
  buttonDisabled: { backgroundColor: '#A9A9A9' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});