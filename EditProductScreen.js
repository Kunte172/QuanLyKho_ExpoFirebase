import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Modal, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  doc, getDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, limit, addDoc, onSnapshot
} from 'firebase/firestore';
import { db } from './firebaseConfig'; // <-- KIỂM TRA ĐƯỜNG DẪN NÀY

export default function EditProductScreen({ route, navigation }) {
  const { productId } = route.params;
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [customId, setCustomId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Category Modal State
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // Unit Modal State
  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [showNewUnitInput, setShowNewUnitInput] = useState(false);

  // Effect load product data
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const product = docSnap.data();
          setName(product.name || '');
          setPrice(product.price?.toString() || '');
          setStock(product.stock?.toString() || '');
          setCostPrice(product.costPrice?.toString() || '');
          setUnit(product.unit || '');
          setCategory(product.category || '');
          setCustomId(product.id || '');
        } else { Alert.alert('Lỗi', 'Không tìm thấy sản phẩm.'); navigation.goBack(); }
      } catch (error) { Alert.alert('Lỗi', 'Không thể tải dữ liệu sản phẩm.'); navigation.goBack(); }
      setLoading(false);
    };
    fetchProduct();
  }, [productId, navigation]);

  // Effect load Categories
  useEffect(() => {
      setLoadingCategories(true);
      const categoryRef = collection(db, 'categories');
      const unsubscribe = onSnapshot(categoryRef, (querySnapshot) => {
          const categoryList = [];
          querySnapshot.forEach((doc) => { categoryList.push({ id: doc.id, name: doc.data().name }); });
          categoryList.sort((a, b) => a.name.localeCompare(b.name));
          setCategories(categoryList);
          setLoadingCategories(false);
      });
      return () => unsubscribe();
  }, []);

  // Effect load Units
  useEffect(() => {
      setLoadingUnits(true);
      const unitRef = collection(db, 'units');
      const unsubscribe = onSnapshot(unitRef, (querySnapshot) => {
          const unitList = [];
          querySnapshot.forEach((doc) => { unitList.push({ id: doc.id, name: doc.data().name }); });
          unitList.sort((a, b) => a.name.localeCompare(b.name));
          setUnits(unitList);
          setLoadingUnits(false);
      });
      return () => unsubscribe();
  }, []);

  // Function check and add lookup
  const checkAndAddLookup = async (collectionName, value) => {
    if (!value || typeof value !== 'string') return false;
    const trimmedValue = value.trim();
    if (!trimmedValue) return false;
    try {
      const lookupCollection = collection(db, collectionName);
      const q = query(lookupCollection, where("name", "==", trimmedValue), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) { await addDoc(lookupCollection, { name: trimmedValue }); return true; }
      else { return false; }
    } catch (error) { console.warn(`Error check/add '${trimmedValue}' to '${collectionName}':`, error); return false; }
  };

  // Function save update
  const handleUpdateProduct = async () => {
    if (!name || !price || !stock || !costPrice || !unit || !category) { Alert.alert('Lỗi', 'Vui lòng nhập/chọn đầy đủ thông tin.'); return; }
    setSaving(true);
    try {
      await checkAndAddLookup('units', unit);
      await checkAndAddLookup('categories', category);
      const docRef = doc(db, 'products', productId);
      await updateDoc(docRef, {
        name: name, price: parseFloat(price), stock: parseInt(stock, 10),
        costPrice: parseFloat(costPrice), unit: unit.trim(), category: category.trim(),
      });
      navigation.goBack();
    } catch (error) { console.error("Error updating product:", error); Alert.alert('Lỗi', 'Không thể cập nhật sản phẩm.'); }
    setSaving(false);
  };

  // Function delete product
  const handleDeleteProduct = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'products', productId);
      await deleteDoc(docRef);
      navigation.goBack();
    } catch (error) { console.error("Error deleting product:", error); Alert.alert('Lỗi', 'Không thể xóa sản phẩm.'); setSaving(false); }
  };

  // Function confirm delete
  const confirmDelete = () => { Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa "${name}"?`, [ { text: 'Hủy', style: 'cancel' }, { text: 'Xóa', style: 'destructive', onPress: handleDeleteProduct } ], { cancelable: true }); };

  // Modal Handlers (Category)
  const handleSelectCategory = (selectedCategory) => { setCategory(selectedCategory.name); setCategoryModalVisible(false); setShowNewCategoryInput(false); setNewCategoryName(''); };
  const handleCreateAndSelectCategory = async () => { const trimmedName = newCategoryName.trim(); if (!trimmedName) { Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm hàng mới.'); return; } setLoadingCategories(true); await checkAndAddLookup('categories', trimmedName); setLoadingCategories(false); setCategory(trimmedName); setCategoryModalVisible(false); setShowNewCategoryInput(false); setNewCategoryName(''); };

  // Modal Handlers (Unit)
  const handleSelectUnit = (selectedUnit) => { setUnit(selectedUnit.name); setUnitModalVisible(false); setShowNewUnitInput(false); setNewUnitName(''); };
  const handleCreateAndSelectUnit = async () => { const trimmedName = newUnitName.trim(); if (!trimmedName) { Alert.alert('Lỗi', 'Vui lòng nhập tên đơn vị mới.'); return; } setLoadingUnits(true); await checkAndAddLookup('units', trimmedName); setLoadingUnits(false); setUnit(trimmedName); setUnitModalVisible(false); setShowNewUnitInput(false); setNewUnitName(''); };

  if (loading) { return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></View>; }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
           <TouchableOpacity onPress={() => navigation.goBack()} disabled={saving} style={styles.backButton}>
               <Ionicons name="chevron-back-outline" size={32} color={saving ? '#AAA' : '#007AFF'} />
           </TouchableOpacity>
           <Text style={styles.headerTitle} numberOfLines={1}>{name || 'Sửa hàng hóa'}</Text>
           <TouchableOpacity onPress={handleUpdateProduct} disabled={saving}>
               <Text style={styles.editButtonText}>Sửa</Text>
           </TouchableOpacity>
        </View>

        <ScrollView style={styles.form}>
          <Text style={styles.sectionTitle}>THÔNG TIN CƠ BẢN</Text>
          <View style={styles.imagePlaceholderContainer}><View style={styles.imagePlaceholderView}><Ionicons name="image" size={50} color="#CCC" /></View></View>
          <Text style={styles.label}>Tên hàng hóa *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          {/* Unit Picker */}
          <Text style={styles.label}>Đơn vị *</Text>
          <TouchableOpacity style={styles.pickerInput} onPress={() => { setUnitModalVisible(true); setShowNewUnitInput(false); setNewUnitName(''); }}>
            <Text style={unit ? styles.pickerText : styles.pickerPlaceholder}>{unit || 'Chọn đơn vị'}</Text>
            <Ionicons name="chevron-down" size={20} color="#888" />
          </TouchableOpacity>
          <Text style={styles.label}>Mã hàng</Text>
          <Text style={styles.staticId}>{customId}</Text>
          {/* Prices Row */}
          <View style={styles.row}>
            <View style={styles.column}><Text style={styles.label}>Giá vốn *</Text><TextInput style={styles.input} value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" /></View>
            <View style={styles.column}><Text style={styles.label}>Giá bán *</Text><TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" /></View>
          </View>
          {/* Category/Stock Row */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Nhóm hàng *</Text>
              <TouchableOpacity style={styles.pickerInput} onPress={() => { setCategoryModalVisible(true); setShowNewCategoryInput(false); setNewCategoryName(''); }}>
                <Text style={category ? styles.pickerText : styles.pickerPlaceholder}>{category || 'Chọn nhóm hàng'}</Text>
                <Ionicons name="chevron-down" size={20} color="#888" />
              </TouchableOpacity>
            </View>
            <View style={styles.column}><Text style={styles.label}>Tồn kho *</Text><TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" /></View>
          </View>
          {saving && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}
          {/* Delete Button */}
          <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete} disabled={saving}>
            <Text style={styles.deleteButtonText}>Xóa sản phẩm</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Category Modal */}
        <Modal animationType="slide" transparent={true} visible={categoryModalVisible} onRequestClose={() => setCategoryModalVisible(false)}>
            <View style={styles.modalOverlay}><View style={styles.modalContent}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Chọn nhóm hàng</Text><TouchableOpacity onPress={() => setCategoryModalVisible(false)}><Ionicons name="close-circle" size={30} color="#AAA" /></TouchableOpacity></View>{!showNewCategoryInput ? (<TouchableOpacity style={styles.createNewButton} onPress={() => setShowNewCategoryInput(true)}><Ionicons name="add-circle-outline" size={22} color="#007AFF" /><Text style={styles.createNewButtonText}>Tạo nhóm hàng mới</Text></TouchableOpacity>) : (<View style={styles.newCategoryInputContainer}><TextInput style={styles.newCategoryInput} placeholder="Nhập tên nhóm hàng mới..." value={newCategoryName} onChangeText={setNewCategoryName} autoFocus={true}/><TouchableOpacity style={styles.confirmNewCategoryButton} onPress={handleCreateAndSelectCategory} disabled={loadingCategories}>{loadingCategories ? <ActivityIndicator size="small" color="#FFF"/> : <Text style={styles.confirmNewCategoryButtonText}>Thêm</Text>}</TouchableOpacity><TouchableOpacity onPress={() => setShowNewCategoryInput(false)}><Ionicons name="close-circle-outline" size={26} color="#AAA" style={{marginLeft: 5}}/></TouchableOpacity></View>)}{loadingCategories && !showNewCategoryInput && <ActivityIndicator size="large" color="#007AFF" />}{!loadingCategories && !showNewCategoryInput && (<FlatList data={categories} keyExtractor={(item) => item.id} renderItem={({ item }) => (<TouchableOpacity style={styles.modalItem} onPress={() => handleSelectCategory(item)}><Text style={styles.modalItemText}>{item.name}</Text></TouchableOpacity>)} ListEmptyComponent={<Text style={styles.emptyListText}>Chưa có nhóm hàng nào.</Text>} style={{marginTop: 10}}/>)}</View></View>
        </Modal>
        {/* Unit Modal */}
        <Modal animationType="slide" transparent={true} visible={unitModalVisible} onRequestClose={() => setUnitModalVisible(false)}>
            <View style={styles.modalOverlay}><View style={styles.modalContent}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Chọn đơn vị</Text><TouchableOpacity onPress={() => setUnitModalVisible(false)}><Ionicons name="close-circle" size={30} color="#AAA" /></TouchableOpacity></View>{!showNewUnitInput ? (<TouchableOpacity style={styles.createNewButton} onPress={() => setShowNewUnitInput(true)}><Ionicons name="add-circle-outline" size={22} color="#007AFF" /><Text style={styles.createNewButtonText}>Tạo đơn vị mới</Text></TouchableOpacity>) : (<View style={styles.newCategoryInputContainer}><TextInput style={styles.newCategoryInput} placeholder="Nhập tên đơn vị mới..." value={newUnitName} onChangeText={setNewUnitName} autoFocus={true}/><TouchableOpacity style={styles.confirmNewCategoryButton} onPress={handleCreateAndSelectUnit} disabled={loadingUnits}>{loadingUnits ? <ActivityIndicator size="small" color="#FFF"/> : <Text style={styles.confirmNewCategoryButtonText}>Thêm</Text>}</TouchableOpacity><TouchableOpacity onPress={() => setShowNewUnitInput(false)}><Ionicons name="close-circle-outline" size={26} color="#AAA" style={{marginLeft: 5}}/></TouchableOpacity></View>)}{loadingUnits && !showNewUnitInput && <ActivityIndicator size="large" color="#007AFF" />}{!loadingUnits && !showNewUnitInput && (<FlatList data={units} keyExtractor={(item) => item.id} renderItem={({ item }) => (<TouchableOpacity style={styles.modalItem} onPress={() => handleSelectUnit(item)}><Text style={styles.modalItemText}>{item.name}</Text></TouchableOpacity>)} ListEmptyComponent={<Text style={styles.emptyListText}>Chưa có đơn vị nào.</Text>} style={{marginTop: 10}}/>)}</View></View>
        </Modal>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', flex: 1, marginHorizontal: 5 },
  editButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '600', paddingHorizontal: 10 },
  form: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, color: '#666', fontWeight: '500', marginTop: 20, marginBottom: 10 },
  imagePlaceholderContainer: { alignItems: 'flex-start', marginBottom: 15 },
  imagePlaceholderView: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#EFEFEF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  label: { fontSize: 15, fontWeight: '500', color: '#333', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  staticId: { fontSize: 16, color: '#555', backgroundColor: '#EFEFEF', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 0 },
  column: { flex: 1, marginRight: 8 },
  'column:last-child': { marginRight: 0 },
  pickerInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, minHeight: 45 },
  pickerText: { fontSize: 16, color: '#000' },
  pickerPlaceholder: { fontSize: 16, color: '#BBB' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalItemText: { fontSize: 16 },
  emptyListText: { textAlign: 'center', paddingVertical: 20, color: '#888', fontSize: 16 },
  createNewButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE', marginBottom: 10 },
  createNewButtonText: { marginLeft: 10, fontSize: 16, color: '#007AFF', fontWeight: '500' },
  newCategoryInputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 5 },
  newCategoryInput: { flex: 1, borderWidth: 1, borderColor: '#CCC', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, marginRight: 10 },
  confirmNewCategoryButton: { backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 9, borderRadius: 8, justifyContent: 'center', alignItems: 'center', minWidth: 60 },
  confirmNewCategoryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  deleteButton: { marginTop: 30, marginBottom: 20, backgroundColor: '#FF3B30', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  deleteButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});