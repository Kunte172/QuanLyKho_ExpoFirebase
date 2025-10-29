import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity,
  StatusBar, Alert, TextInput, ActivityIndicator, Modal, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query } from 'firebase/firestore'; 
import { db } from './firebaseConfig';
import { useAuth } from './AuthContext'; // <-- SỬ DỤNG useAuth

// --- Component ProductItem ---
const ProductItem = ({ item, onPress }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    {/* Placeholder ảnh */}
    <View style={styles.itemImagePlaceholder}>
      <Ionicons name="image" size={24} color="#CCC" />
    </View>
    <View style={styles.itemInfo}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemSku}>{item.id}</Text> 
    </View>
    <View style={styles.itemStockInfo}>
      <Text style={styles.itemPrice}>{item.price ? item.price.toLocaleString('vi-VN') : 0} đ</Text>
      <Text style={styles.itemStock}>Tồn: {item.stock || 0} {item.unit || ''}</Text>
    </View>
  </TouchableOpacity>
);
// --- KẾT THÚC ProductItem ---


// --- Màn hình Home ---
export default function HomeScreen({ navigation }) {
  const { userRole, isManager, logout } = useAuth(); // <-- Lấy role và hàm logout

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // useEffect đọc sản phẩm
  useEffect(() => {
    setLoading(true);
    const productRef = query(collection(db, 'products')); 
    
    const unsubscribe = onSnapshot(productRef, (querySnapshot) => {
      const productList = [];
      querySnapshot.forEach((doc) => {
        productList.push({ firestoreId: doc.id, ...doc.data() });
      });
      setProducts(productList);
      setLoading(false);
    }, (error) => { console.error("Lỗi đọc sản phẩm:", error); setLoading(false); });
    return () => unsubscribe();
  }, []);

  // useEffect đọc Nhóm hàng
  useEffect(() => {
    const categoryRef = collection(db, 'categories');
    const unsubscribe = onSnapshot(categoryRef, (querySnapshot) => {
      const categoryList = [{ id: 'all', name: 'Tất cả loại hàng' }];
      querySnapshot.forEach((doc) => { categoryList.push({ id: doc.id, name: doc.data().name }); });
      categoryList.sort((a, b) => { 
        if (a.id === 'all') return -1; 
        if (b.id === 'all') return 1; 
        return a.name.localeCompare(b.name); 
      });
      setCategories(categoryList);
    }, (error) => { console.error("Lỗi đọc nhóm hàng:", error); });
    return () => unsubscribe();
  }, []);

  // Logic lọc và sắp xếp (Sắp xếp trong bộ nhớ)
  const filteredAndSortedData = useMemo(() => {
    let data = [...products];
    
    // 1. Lọc theo tìm kiếm
    if (searchQuery) { 
      const textData = searchQuery.toUpperCase(); 
      data = data.filter((item) => (item.name ? item.name.toUpperCase() : '').indexOf(textData) > -1); 
    }
    
    // 2. Lọc theo danh mục
    if (selectedCategory && selectedCategory.id !== 'all') { 
      data = data.filter(item => item.category === selectedCategory.name); 
    }

    // 3. Sắp xếp theo giá (Ưu tiên)
    if (sortOrder === 'asc') { 
      data.sort((a, b) => (a.price || 0) - (b.price || 0)); 
    } else if (sortOrder === 'desc') { 
      data.sort((a, b) => (b.price || 0) - (a.price || 0)); 
    } else {
      // Mặc định sắp xếp theo tên
      data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    
    return data;
  }, [products, searchQuery, selectedCategory, sortOrder]);

  // Tính tổng tồn kho
  const totalStockQuantity = useMemo(() => products.reduce((sum, item) => sum + (item.stock || 0), 0), [products]);

  // Hàm render item
  const renderProductItem = ({ item }) => (
    <ProductItem 
        item={item} 
        // 🚨 PHÂN QUYỀN TRÊN ITEM PRESS: Chỉ Admin được vào Edit/Delete
        onPress={() => isManager ? 
            navigation.navigate('EditProduct', { productId: item.firestoreId }) : 
            Alert.alert('Thông báo', 'Bạn không có quyền chỉnh sửa/xóa hàng hóa. Vui lòng liên hệ quản trị viên.')
        } 
    />
  );
  
  // Hàm chọn Category
  const handleSelectCategory = (category) => { setSelectedCategory(category); setCategoryModalVisible(false); };
  // Hàm chọn Sắp xếp
  const handleSelectSort = (order) => { setSortOrder(order); setSortModalVisible(false); };
  
  // Xử lý Logout
  const handleLogout = () => {
    Alert.alert(
        "Đăng xuất", 
        "Bạn có chắc muốn đăng xuất?",
        [
            { text: "Hủy", style: "cancel" },
            { text: "Đăng xuất", onPress: logout, style: "destructive" },
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
        <Text style={styles.headerTitle}>Hàng hóa</Text>
        {/* HIỂN THỊ VAI TRÒ & LOGOUT */}
        <View style={styles.headerRight}>
            <Text style={styles.roleText}>{userRole === 'admin' ? 'Quản trị' : 'Nhân viên'}</Text> 
            <TouchableOpacity onPress={handleLogout} style={{marginLeft: 10}}>
                <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
        </View>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput 
            style={styles.searchInput} 
            placeholder="Tìm kiếm hàng hóa..." 
            value={searchQuery} 
            onChangeText={setSearchQuery}
        />
      </View>
      
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setCategoryModalVisible(true)}>
              <Text style={styles.filterText} numberOfLines={1}>{selectedCategory?.name || 'Tất cả'}</Text>
              <Ionicons name="chevron-down" size={16} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={() => setSortModalVisible(true)}>
              <Text style={styles.filterText}>{sortOrder === 'asc' ? 'Giá tăng' : sortOrder === 'desc' ? 'Giá giảm' : 'Sắp xếp'}</Text>
              <Ionicons name="chevron-down" size={16} color="#555" />
          </TouchableOpacity>
      </View>
      
      {/* Summary Card */}
      <View style={styles.summaryCard}>
          <View>
              <Text style={styles.summaryTitle}>Tổng tồn kho</Text>
              <Text style={styles.summarySubtitle}>Số lượng</Text>
          </View>
          <Text style={styles.summaryValue}>{totalStockQuantity}</Text>
      </View>
      
      {/* Product List */}
      <FlatList 
          data={filteredAndSortedData} 
          renderItem={renderProductItem} 
          keyExtractor={(item) => item.firestoreId} 
          style={styles.list} 
          ListEmptyComponent={<Text style={styles.emptyListText}>Không tìm thấy hàng hóa.</Text>}
      />
      
      {/* Add Button (Chỉ hiển thị cho Admin) */}
      {isManager && (
          <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddProduct')}>
              <Ionicons name="add" size={30} color="#FFFFFF" />
          </TouchableOpacity>
      )}

      {/* Category Modal */}
      <Modal animationType="fade" transparent={true} visible={categoryModalVisible} onRequestClose={() => setCategoryModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setCategoryModalVisible(false)}>
          <View style={[styles.modalContent, styles.categoryModal]}>
            <Text style={styles.modalTitle}>Chọn nhóm hàng</Text>
            <FlatList 
                data={categories} 
                keyExtractor={(item) => item.id} 
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectCategory(item)}>
                    <Text style={[styles.modalItemText, selectedCategory?.id === item.id && styles.modalItemSelected]}>{item.name}</Text>
                    {selectedCategory?.id === item.id && <Ionicons name="checkmark-circle" size={20} color="#007AFF"/>}
                  </TouchableOpacity>
                )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sort Modal */}
      <Modal animationType="fade" transparent={true} visible={sortModalVisible} onRequestClose={() => setSortModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setSortModalVisible(false)}>
          <View style={[styles.modalContent, styles.sortModal]}>
            <Text style={styles.modalTitle}>Sắp xếp theo giá</Text>
            <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectSort(null)}>
              <Text style={[styles.modalItemText, sortOrder === null && styles.modalItemSelected]}>Mặc định (Theo tên)</Text>
              {sortOrder === null && <Ionicons name="checkmark-circle" size={20} color="#007AFF"/>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectSort('asc')}>
              <Text style={[styles.modalItemText, sortOrder === 'asc' && styles.modalItemSelected]}>Giá tăng dần</Text>
              {sortOrder === 'asc' && <Ionicons name="checkmark-circle" size={20} color="#007AFF"/>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectSort('desc')}>
              <Text style={[styles.modalItemText, sortOrder === 'desc' && styles.modalItemSelected]}>Giá giảm dần</Text>
              {sortOrder === 'desc' && <Ionicons name="checkmark-circle" size={20} color="#007AFF"/>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
    </SafeAreaView>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE'},
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerRight: {flexDirection: 'row', alignItems: 'center'},
  roleText: { fontSize: 14, color: '#007AFF', fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#E0F0FF', borderRadius: 5 }, 
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 12 },
  searchInput: { flex: 1, height: 40, backgroundColor: '#F0F0F0', borderRadius: 8, paddingLeft: 35, paddingRight: 15, fontSize: 16 },
  searchIcon: { position: 'absolute', left: 28, zIndex: 1 },
  filterContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 10, maxWidth: '45%' },
  filterText: { fontSize: 14, marginRight: 4, color: '#333', flexShrink: 1 },
  summaryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, marginHorizontal: 16, marginTop: 16, borderRadius: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  summarySubtitle: { fontSize: 14, color: '#888', marginTop: 2 },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  list: { marginTop: 16, flex: 1 },
  emptyListText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888'},
  itemContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'center' },
  itemImagePlaceholder: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#EFEFEF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemInfo: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 16, fontWeight: '500' },
  itemSku: { fontSize: 14, color: '#888', marginTop: 4 },
  itemStockInfo: { alignItems: 'flex-end' },
  itemPrice: { fontSize: 16, fontWeight: '500' },
  itemStock: { fontSize: 14, color: '#888', marginTop: 4 },
  fab: { position: 'absolute', width: 60, height: 60, alignItems: 'center', justifyContent: 'center', right: 20, bottom: 20, backgroundColor: '#007AFF', borderRadius: 30, elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 20, width: '80%', maxHeight: '60%' },
  categoryModal: { maxHeight: '80%' },
  sortModal: { width: '70%', maxHeight: '40%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalItemText: { fontSize: 16, flex: 1 },
  modalItemSelected: { color: '#007AFF', fontWeight: 'bold' },
});