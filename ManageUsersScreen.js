import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, doc, updateDoc, query } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useAuth } from './AuthContext';

// --- Component Item Người dùng ---
const UserItem = ({ user, currentUserId, onRoleChange, navigation }) => {
  const isCurrentUser = user.id === currentUserId;
  const newRole = user.role === 'admin' ? 'staff' : 'admin';

  return (
    <TouchableOpacity 
      style={styles.itemContainer} 
      // Admin bấm vào để chỉnh sửa chi tiết (Màn hình mới)
      onPress={() => {
        if (!isCurrentUser) {
          navigation.navigate('EditUser', { userId: user.id, email: user.email, role: user.role });
        }
      }}
      disabled={isCurrentUser} // Không thể chỉnh sửa chính mình qua màn hình này
    >
      <View style={styles.itemInfo}>
        <Text style={styles.userName}>{user.email}</Text>
        <Text style={styles.userRole}>
          Vai trò: <Text style={{fontWeight: 'bold', color: user.role === 'admin' ? '#FF9500' : '#007AFF'}}>
            {user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
          </Text>
          {isCurrentUser && ' (Bạn)'}
        </Text>
      </View>
      
      {/* Nút thay đổi vai trò nhanh (Chỉ Admin khác mới được sửa) */}
      {!isCurrentUser && (
        <TouchableOpacity 
          style={styles.changeRoleButton}
          onPress={() => onRoleChange(user.id, newRole)}
        >
          <Text style={styles.changeRoleText}>
            Chuyển thành {newRole === 'admin' ? 'Admin' : 'Nhân viên'}
          </Text>
        </TouchableOpacity>
      )}
      {isCurrentUser && (
        <Text style={styles.selfLabel}>Tài khoản hiện tại</Text>
      )}
    </TouchableOpacity>
  );
};
// --- KẾT THÚC Component Item Người dùng ---


export default function ManageUsersScreen({ navigation }) {
  const { isManager, currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Chỉ Admin mới được truy cập màn hình này
  useEffect(() => {
    if (!isManager && !loading) {
      Alert.alert('Không có quyền', 'Bạn không có quyền truy cập màn hình quản lý người dùng.');
      navigation.goBack();
    }
  }, [isManager, loading, navigation]);


  // 2. Lắng nghe danh sách người dùng từ Firestore
  useEffect(() => {
    if (!isManager) return; // Chỉ lắng nghe nếu là Admin

    const userRef = collection(db, 'users');
    const q = query(userRef); 

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userList = [];
      querySnapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() });
      });
      // Sắp xếp: Admin lên đầu, sau đó là Staff
      userList.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role === 'staff' && b.role === 'admin') return 1;
        return a.email.localeCompare(b.email);
      });
      setUsers(userList);
      setLoading(false);
    }, (error) => { console.error("Lỗi đọc người dùng:", error); setLoading(false); });

    return () => unsubscribe();
  }, [isManager]);

  // 3. Hàm thay đổi vai trò
  const handleChangeRole = async (userId, newRole) => {
    if (!isManager) {
      Alert.alert('Lỗi', 'Bạn không có quyền thực hiện thao tác này.');
      return;
    }
    
    Alert.alert(
      "Xác nhận thay đổi",
      `Bạn có chắc chắn muốn chuyển người dùng này thành ${newRole === 'admin' ? 'Quản trị viên' : 'Nhân viên'}?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xác nhận", 
          style: "destructive", 
          onPress: async () => {
            setIsUpdating(true);
            try {
              const userDocRef = doc(db, 'users', userId);
              await updateDoc(userDocRef, { role: newRole });
              Alert.alert('Thành công', `Đã cập nhật vai trò thành ${newRole}.`);
            } catch (error) {
              console.error("Lỗi cập nhật vai trò:", error);
              Alert.alert('Lỗi', 'Không thể cập nhật vai trò người dùng.');
            } finally {
              setIsUpdating(false);
            }
          }
        },
      ],
      { cancelable: true }
    );
  };


  if (loading) { return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>; }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={isUpdating} style={styles.backButton}>
           <Ionicons name="chevron-back-outline" size={30} color={isUpdating ? '#AAA' : '#007AFF'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Người dùng</Text>
        <View style={{ width: 30 }} /> 
      </View>

      <FlatList 
        data={users}
        renderItem={({ item }) => (
          <UserItem 
            user={item} 
            currentUserId={currentUser?.uid}
            onRoleChange={handleChangeRole}
            navigation={navigation} // Truyền navigation cho component con
          />
        )}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyListText}>Chưa có người dùng nào được đăng ký.</Text>}
      />

      {/* Modal Loading khi cập nhật */}
      <Modal animationType="fade" transparent={true} visible={isUpdating}>
        <View style={styles.modalOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.modalText}>Đang cập nhật vai trò...</Text>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', flex: 1 },
  
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  emptyListText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888'},

  itemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 15, paddingHorizontal: 15, borderRadius: 8, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 },
  itemInfo: { flex: 1, marginRight: 10 },
  userName: { fontSize: 16, fontWeight: '500', color: '#333' },
  userRole: { fontSize: 14, color: '#666', marginTop: 3 },
  
  changeRoleButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  changeRoleText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  selfLabel: { fontSize: 14, color: '#666', fontStyle: 'italic' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalText: { color: '#FFFFFF', marginTop: 10, fontSize: 16 },
});
