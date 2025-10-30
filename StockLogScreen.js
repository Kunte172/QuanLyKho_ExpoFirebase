import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useAuth } from './AuthContext';

// --- Component Item Lịch sử Giao dịch ---
const LogItem = ({ item }) => {
  const isImport = item.type === 'import';
  const iconName = isImport ? 'arrow-down-circle' : 'arrow-up-circle';
  const color = isImport ? '#00A86B' : '#FF3B30';

  return (
    <View style={styles.itemContainer}>
      <Ionicons name={iconName} size={30} color={color} style={styles.itemIcon} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemType}>{isImport ? 'NHẬP KHO' : 'XUẤT KHO'}</Text>
        <Text style={styles.itemName} numberOfLines={1}>{item.productName || 'N/A'}</Text>
        <Text style={styles.itemReason} numberOfLines={1}>Lý do: {item.reason}</Text>
      </View>
      <View style={styles.itemQuantityArea}>
        <Text style={[styles.itemQuantity, { color: color }]}>
          {isImport ? '+' : '-'} {item.quantity.toLocaleString()}
        </Text>
        <Text style={styles.itemDate}>
          {item.timestamp?.toDate().toLocaleTimeString('vi-VN')}
        </Text>
      </View>
    </View>
  );
};
// --- KẾT THÚC Component Item ---

export default function StockLogScreen({ navigation }) {
  const { isManager, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Kiểm tra quyền Admin
  useEffect(() => {
    if (!isManager && !authLoading) {
      Alert.alert('Không có quyền', 'Bạn không có quyền truy cập lịch sử nhập xuất.');
      navigation.goBack();
    }
  }, [isManager, authLoading, navigation]);


  // 2. Lắng nghe danh sách lịch sử giao dịch
  useEffect(() => {
    if (!isManager) return;

    setLoading(true);
    const logRef = collection(db, 'stock_logs');
    // Sắp xếp theo timestamp mới nhất
    const q = query(logRef, orderBy('timestamp', 'desc')); 

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logList = [];
      querySnapshot.forEach((doc) => {
        logList.push({ id: doc.id, ...doc.data() });
      });
      setLogs(logList);
      setLoading(false);
    }, (error) => { 
        console.error("Lỗi đọc lịch sử kho:", error); 
        setLoading(false); 
        Alert.alert('Lỗi', 'Không thể tải dữ liệu lịch sử nhập/xuất kho.');
    });

    return () => unsubscribe();
  }, [isManager]);

  if (loading || authLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }
  
  if (!isManager) return null; // Không hiển thị gì nếu không phải Admin (đã bị chặn ở useEffect)

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <Ionicons name="chevron-back-outline" size={30} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử Nhập/Xuất Kho</Text>
        <View style={{ width: 30 }} />
      </View>

      <FlatList 
        data={logs}
        renderItem={({ item }) => <LogItem item={item} />}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyListText}>Chưa có giao dịch nhập/xuất kho nào.</Text>}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', flex: 1 },
  list: { flex: 1, paddingTop: 10 },
  emptyListText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888'},

  itemContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 8, marginHorizontal: 16, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 },
  itemIcon: { marginRight: 15 },
  itemInfo: { flex: 1, marginRight: 10 },
  itemType: { fontSize: 13, fontWeight: 'bold', color: '#666' },
  itemName: { fontSize: 16, fontWeight: '500', color: '#333', marginTop: 2 },
  itemReason: { fontSize: 13, color: '#888', marginTop: 2 },
  itemQuantityArea: { alignItems: 'flex-end' },
  itemQuantity: { fontSize: 16, fontWeight: 'bold' },
  itemDate: { fontSize: 12, color: '#AAA', marginTop: 2 },
});
