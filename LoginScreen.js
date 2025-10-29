import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';

// Import useAuth từ AuthContext
import { useAuth } from './AuthContext'; // <-- KIỂM TRA ĐƯỜNG DẪN NÀY

const logo = require('./assets/kiotviet-logo.png');

export default function LoginScreen({ navigation }) {
  // Lấy hàm login từ context
  const { login } = useAuth(); // <-- Gọi useAuth ở đây

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const email = username;
    if (!email || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ Email và Password.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      // Đăng nhập thành công, không cần làm gì thêm
    } catch (error) {
      let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Sai Email hoặc Mật khẩu.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email không hợp lệ.';
      }
      Alert.alert('Đăng nhập thất bại', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.buttonContainer, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  logo: { width: 180, height: 60, alignSelf: 'center', marginBottom: 50 },
  input: { height: 50, backgroundColor: '#FFFFFF', borderColor: '#DDDDDD', borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 16, fontSize: 16 },
  buttonContainer: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 10, marginTop: 20, alignItems: 'center', justifyContent: 'center', height: 50 },
  buttonDisabled: { backgroundColor: '#A9A9A9' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});