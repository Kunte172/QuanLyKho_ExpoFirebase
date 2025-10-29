import React from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import { useNavigation } from '@react-navigation/native';

// Component đại diện cho một tùy chọn trong menu
const OptionRow = ({ icon, title, onPress, isDestructive = false }) => (
  <TouchableOpacity style={styles.optionRow} onPress={onPress}>
    <Ionicons name={icon} size={24} color={isDestructive ? '#FF3B30' : '#007AFF'} style={styles.optionIcon} />
    <Text style={[styles.optionTitle, isDestructive && styles.destructiveText]}>{title}</Text>
    <Ionicons name="chevron-forward" size={20} color="#CCC" />
  </TouchableOpacity>
);

export default function MoreScreen() {
  const { logout, userRole, isManager } = useAuth();
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Đăng xuất", onPress: logout, style: "destructive" }, // Gọi hàm logout từ Context
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nhiều hơn</Text>
        <Text style={styles.roleTag}>{isManager ? 'Quản trị viên' : 'Nhân viên'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Khu vực Tài khoản và Bảo mật */}
        <Text style={styles.sectionHeader}>TÀI KHOẢN</Text>
        <View style={styles.card}>
          <OptionRow
            icon="key-outline"
            title="Đổi mật khẩu"
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </View>
        
        {/* 2. Khu vực Quản trị (Chỉ Admin) */}
        {isManager && (
          <>
            <Text style={styles.sectionHeader}>QUẢN LÝ HỆ THỐNG</Text>
            <View style={styles.card}>
              <OptionRow
                icon="people-outline"
                title="Quản lý người dùng"
                onPress={() => Alert.alert('Tính năng đang phát triển', 'Chuyển đến màn hình quản lý người dùng')}
              />
              <OptionRow
                icon="settings-outline"
                title="Cài đặt chung"
                onPress={() => Alert.alert('Tính năng đang phát triển', 'Chuyển đến màn hình cài đặt hệ thống')}
              />
            </View>
          </>
        )}

        {/* 3. Nút Đăng xuất */}
        <View style={styles.logoutContainer}>
          <OptionRow
            icon="log-out-outline"
            title="Đăng xuất"
            isDestructive={true}
            onPress={handleLogout} // KẾT NỐI VỚI HÀM LOGOUT
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { paddingHorizontal: 16, paddingVertical: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  roleTag: { fontSize: 14, color: '#007AFF', fontWeight: '600', backgroundColor: '#E0F0FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5 },
  scrollContent: { padding: 16 },
  sectionHeader: { fontSize: 14, color: '#888', fontWeight: '600', marginTop: 20, marginBottom: 8, marginHorizontal: 5 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#EEE' },
  optionRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionIcon: { marginRight: 15 },
  optionTitle: { flex: 1, fontSize: 16, color: '#333' },
  destructiveText: { color: '#FF3B30', fontWeight: '500' },
  logoutContainer: { marginTop: 30, backgroundColor: '#FFFFFF', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#EEE' },
});
