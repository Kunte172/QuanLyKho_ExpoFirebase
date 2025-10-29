import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';

// Đường dẫn đến ảnh (đảm bảo đúng)
const logo = require('./assets/kiotviet-logo.png');
const introImage = require('./assets/intro-1.png');

// Nhận prop { navigation }
export default function IntroScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <View style={styles.content}>
        <Image source={introImage} style={styles.slideImage} resizeMode="contain" />
        <Text style={styles.title}>Báo cáo chi tiết</Text>
        <Text style={styles.description}>
          Dễ dàng theo dõi liệu trình khách hàng, doanh thu, lợi nhuận
        </Text>
      </View>
      {/* Vùng đệm */}
      <View style={{ flex: 1 }} />
      <View style={styles.buttonContainer}>
        {/* Nút Đăng ký (đã sửa onPress) */}
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => navigation.navigate('SignUp')} // Điều hướng đến SignUp
        >
          <Text style={styles.buttonTextPrimary}>Đăng ký</Text>
        </TouchableOpacity>
        {/* Nút Đăng nhập */}
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => navigation.navigate('Login')} // Điều hướng đến Login
        >
          <Text style={styles.buttonTextSecondary}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingBottom: 20 },
  logo: { width: 150, height: 50, alignSelf: 'center', marginTop: 20, marginBottom: 30 },
  content: { alignItems: 'center', paddingHorizontal: 30 },
  slideImage: { width: '90%', height: 300, marginBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  description: { fontSize: 16, color: '#666', textAlign: 'center' },
  buttonContainer: { paddingHorizontal: 30 },
  buttonPrimary: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  buttonTextPrimary: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  buttonSecondary: { backgroundColor: '#FFFFFF', paddingVertical: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  buttonTextSecondary: { color: '#007AFF', fontSize: 16, fontWeight: 'bold' },
});