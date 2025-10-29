import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import Firestore functions and db
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebaseConfig'; 

// Component Item Hóa đơn
const InvoiceItem = ({ item, onPress }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <View style={styles.itemInfo}>
      <Text style={styles.itemDate}>
        {item.createdAt?.toDate().toLocaleString('vi-VN') || 'Không có ngày'}
      </Text>
      <Text style={styles.itemInvoiceId}>Mã HD: {item.id.substring(0, 8)}...</Text>
    </View>
    <View style={styles.itemAmountInfo}>
      <Text style={styles.itemAmount}>
        {item.totalAmount.toLocaleString('vi-VN')} đ
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </View>
  </TouchableOpacity>
);

// --- Màn hình Hóa đơn ---
export default function InvoicesScreen({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Đọc danh sách hóa đơn, sắp xếp theo ngày mới nhất
  useEffect(() => {
    setLoading(true);
    const invoiceRef = collection(db, 'invoices');
    const q = query(invoiceRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const invoiceList = [];
      querySnapshot.forEach((doc) => {
        invoiceList.push({ id: doc.id, ...doc.data() });
      });
      setInvoices(invoiceList);
      setLoading(false);
    }, (error) => { console.error("Lỗi đọc hóa đơn:", error); setLoading(false); });
    return () => unsubscribe();
  }, []);

  // 🔥 SỬA LỖI ĐIỀU HƯỚNG: Chuyển hướng đến tên màn hình đúng "InvoicesDetail"
  const handleViewDetails = (invoice) => {
    navigation.navigate('InvoicesDetail', { invoice: invoice });
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hóa đơn</Text>
      </View>
      <FlatList
        data={invoices}
        renderItem={({ item }) => (
          <InvoiceItem
            item={item}
            onPress={() => handleViewDetails(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Chưa có hóa đơn nào.</Text>}
      />
    </SafeAreaView>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  list: { flex: 1 },
  itemContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'center', justifyContent: 'space-between' },
  itemInfo: { flexShrink: 1 },
  itemDate: { fontSize: 16, color: '#333' },
  itemInvoiceId: { fontSize: 13, color: '#888', marginTop: 2 },
  itemAmountInfo: { flexDirection: 'row', alignItems: 'center' },
  itemAmount: { fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888'},
});
