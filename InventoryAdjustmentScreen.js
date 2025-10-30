import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity,
  StatusBar, Alert, TextInput, ActivityIndicator, Keyboard, ScrollView, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, updateDoc, doc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useAuth } from './AuthContext';

// --- Component Item Sản phẩm để chọn ---
const ProductSelectItem = ({ item, onPress }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={() => onPress(item)}>
    <View style={styles.itemImagePlaceholder}>
      <Ionicons name="cube-outline" size={24} color="#555" />
    </View>
    <View style={styles.itemInfo}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemSku}>Mã: {item.id} | Tồn: {item.stock || 0}</Text>
    </View>
    <Text style={styles.itemPrice}>{item.price ? item.price.toLocaleString('vi-VN') : 0} đ</Text>
  </TouchableOpacity>
);

// --- Màn hình Nhập/Xuất kho ---
export default function InventoryAdjustScreen({ navigation }) {
  const { isManager } = useAuth();

  // Trạng thái chung
  const [products, setProducts] = useState([]); // Danh sách sản phẩm gốc
  const [filteredProducts, setFilteredProducts] = useState([]); // Danh sách sản phẩm lọc
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Trạng thái Modal chọn sản phẩm
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Trạng thái Giao dịch
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [transactionType, setTransactionType] = useState('import'); // 'import' hoặc 'export'
  const [reason, setReason] = useState(''); // Lý do nhập/xuất

  // 1. useEffect đọc sản phẩm
  useEffect(() => {
    setLoading(true);
    const productRef = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(productRef, (querySnapshot) => {
      const productList = [];
      querySnapshot.forEach((doc) => {
        productList.push({ firestoreId: doc.id, ...doc.data() });
      });
      setProducts(productList);
      setFilteredProducts(productList);
      setLoading(false);
    }, (error) => { console.error("Lỗi đọc sản phẩm:", error); setLoading(false); });
    return () => unsubscribe();
  }, []);

  // 2. Hàm xử lý tìm kiếm
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredProducts(products);
    } else {
      const textData = query.toUpperCase();
      const filtered = products.filter((item) => (item.name ? item.name.toUpperCase() : '').includes(textData) || (item.id ? item.id.toUpperCase() : '').includes(textData));
      setFilteredProducts(filtered);
    }
  };

  // 3. Hàm chọn sản phẩm từ Modal
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSelectModalVisible(false);
    setAdjustQuantity(''); // Reset số lượng khi chọn sản phẩm mới
    setReason('');
    Keyboard.dismiss();
  };

  // 4. Hàm thực hiện điều chỉnh kho
  const handleAdjustInventory = async () => {
    if (!selectedProduct || !adjustQuantity || !reason) {
      Alert.alert('Lỗi', 'Vui lòng chọn sản phẩm, nhập số lượng và lý do.');
      return;
    }
    const quantity = parseInt(adjustQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Lỗi', 'Số lượng phải là số nguyên dương.');
      return;
    }
    
    // Nếu là Xuất kho, kiểm tra tồn kho tối thiểu
    if (transactionType === 'export' && quantity > (selectedProduct.stock || 0)) {
        Alert.alert('Lỗi tồn kho', `Không thể xuất ${quantity}. Tồn kho hiện tại chỉ có ${selectedProduct.stock}.`);
        return;
    }

    setIsSaving(true);
    const amount = transactionType === 'import' ? quantity : -quantity;
    
    try {
      // 1. Cập nhật tồn kho (sử dụng increment an toàn)
      const productRef = doc(db, 'products', selectedProduct.firestoreId);
      await updateDoc(productRef, {
        stock: increment(amount),
      });

      // 2. Ghi lại lịch sử giao dịch (Collection mới: stock_logs)
      const logRef = collection(db, 'stock_logs');
      await addDoc(logRef, {
        productId: selectedProduct.firestoreId,
        productName: selectedProduct.name,
        type: transactionType,
        quantity: quantity,
        adjustment: amount,
        reason: reason,
        timestamp: serverTimestamp(),
        // userId: currentUser.uid // Thêm vào sau nếu cần
      });

      Alert.alert('Thành công', `Đã ${transactionType === 'import' ? 'Nhập' : 'Xuất'} ${quantity} ${selectedProduct.unit || 'cái'} cho sản phẩm "${selectedProduct.name}".`);
      
      // Reset trạng thái
      setSelectedProduct(null);
      setAdjustQuantity('');
      setReason('');

    } catch (error) {
      console.error("Lỗi điều chỉnh kho:", error);
      Alert.alert('Lỗi', 'Không thể hoàn tất điều chỉnh kho. Vui lòng kiểm tra lại.');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!isManager) {
      return (
          <View style={styles.errorContainer}>
              <Ionicons name="lock-closed-outline" size={50} color="#FF3B30" />
              <Text style={styles.errorText}>Bạn không có quyền thực hiện thao tác này.</Text>
          </View>
      );
  }

  if (loading) { return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>; }


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nhập/Xuất Kho</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Chọn sản phẩm */}
        <Text style={styles.sectionTitle}>SẢN PHẨM CẦN ĐIỀU CHỈNH</Text>
        <TouchableOpacity style={styles.productPicker} onPress={() => setSelectModalVisible(true)} disabled={isSaving}>
            <Text style={styles.pickerText}>
                {selectedProduct ? selectedProduct.name : 'Chạm để chọn sản phẩm...'}
            </Text>
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
        </TouchableOpacity>

        {selectedProduct && (
            <View style={styles.productDetailCard}>
                <Text style={styles.detailText}>Mã: {selectedProduct.id}</Text>
                <Text style={styles.detailText}>Giá vốn: {selectedProduct.costPrice.toLocaleString('vi-VN')} đ</Text>
                <Text style={styles.detailStock}>Tồn kho hiện tại: {selectedProduct.stock} {selectedProduct.unit || ''}</Text>
            </View>
        )}

        {/* Loại giao dịch */}
        <Text style={styles.sectionTitle}>LOẠI GIAO DỊCH</Text>
        <View style={styles.typeSelector}>
            <TouchableOpacity 
                style={[styles.typeButton, transactionType === 'import' && styles.typeButtonActive]}
                onPress={() => setTransactionType('import')}
            >
                <Ionicons name="arrow-down-circle-outline" size={24} color={transactionType === 'import' ? '#FFFFFF' : '#00A86B'} />
                <Text style={[styles.typeButtonText, transactionType === 'import' && styles.typeButtonTextActive]}>NHẬP HÀNG</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.typeButton, transactionType === 'export' && styles.typeButtonActive]}
                onPress={() => setTransactionType('export')}
            >
                <Ionicons name="arrow-up-circle-outline" size={24} color={transactionType === 'export' ? '#FFFFFF' : '#FF3B30'} />
                <Text style={[styles.typeButtonText, transactionType === 'export' && styles.typeButtonTextActive]}>XUẤT HÀNG</Text>
            </TouchableOpacity>
        </View>

        {/* Số lượng và Lý do */}
        <Text style={styles.sectionTitle}>THÔNG TIN CHI TIẾT</Text>
        <Text style={styles.label}>Số lượng điều chỉnh *</Text>
        <TextInput
            style={styles.input}
            placeholder="Nhập số lượng"
            keyboardType="numeric"
            value={adjustQuantity}
            onChangeText={setAdjustQuantity}
            editable={!isSaving}
        />
        
        <Text style={styles.label}>Lý do Nhập/Xuất *</Text>
        <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Ví dụ: Nhập lô hàng mới / Hàng bị lỗi, hủy"
            multiline
            value={reason}
            onChangeText={setReason}
            editable={!isSaving}
        />

        {/* Nút thực hiện */}
        <TouchableOpacity
            style={[styles.actionButton, isSaving && styles.actionButtonDisabled]}
            onPress={handleAdjustInventory}
            disabled={isSaving || !selectedProduct || !adjustQuantity || !reason}
        >
            {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <Text style={styles.actionButtonText}>
                    THỰC HIỆN {transactionType === 'import' ? 'NHẬP KHO' : 'XUẤT KHO'}
                </Text>
            )}
        </TouchableOpacity>

      </ScrollView>

      {/* Modal chọn sản phẩm */}
      <Modal animationType="slide" transparent={false} visible={selectModalVisible} onRequestClose={() => setSelectModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectModalVisible(false)} style={styles.backButton}>
              <Ionicons name="close-circle-outline" size={30} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn Sản phẩm</Text>
            <View style={{ width: 30 }} />
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput style={styles.searchInput} placeholder="Tìm kiếm theo tên hoặc mã..." value={searchQuery} onChangeText={handleSearch} autoFocus={true}/>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={({ item }) => <ProductSelectItem item={item} onPress={handleSelectProduct} />}
              keyExtractor={(item) => item.firestoreId}
              ListEmptyComponent={<Text style={styles.emptyListText}>Không tìm thấy sản phẩm.</Text>}
            />
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8FA', padding: 20 },
  errorText: { fontSize: 18, color: '#FF3B30', marginTop: 15, textAlign: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 50 },
  sectionTitle: { fontSize: 14, color: '#666', fontWeight: 'bold', marginTop: 15, marginBottom: 8 },
  label: { fontSize: 15, fontWeight: '500', color: '#333', marginBottom: 6 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 15 },
  
  // Product Picker
  productPicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', marginBottom: 15 },
  pickerText: { fontSize: 16, color: '#007AFF', fontWeight: '500' },
  productDetailCard: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#007AFF30' },
  detailText: { fontSize: 14, color: '#666', marginBottom: 2 },
  detailStock: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 5 },
  
  // Type Selector
  typeSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  typeButton: { flex: 1, padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', alignItems: 'center', marginHorizontal: 5, flexDirection: 'row', justifyContent: 'center' },
  typeButtonActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  typeButtonText: { fontSize: 15, fontWeight: 'bold', marginLeft: 8, color: '#333' },
  typeButtonTextActive: { color: '#FFFFFF' },

  // Action Button
  actionButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  actionButtonDisabled: { backgroundColor: '#A9A9A9' },
  actionButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#F7F8FA' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  backButton: { padding: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EEE'},
  searchInput: { flex: 1, height: 40, backgroundColor: '#F0F0F0', borderRadius: 8, paddingLeft: 35, paddingRight: 15, fontSize: 16 },
  searchIcon: { position: 'absolute', left: 28, zIndex: 1 },
  emptyListText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888'},

  // Item List (Trong Modal)
  itemContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'center', justifyContent: 'space-between' },
  itemImagePlaceholder: { width: 40, height: 40, borderRadius: 4, backgroundColor: '#EFEFEF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemInfo: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 16, fontWeight: '500' },
  itemSku: { fontSize: 13, color: '#888', marginTop: 2 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
});
