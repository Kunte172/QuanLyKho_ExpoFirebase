import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Modal, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  addDoc, collection, doc, getDoc, updateDoc, writeBatch,
  query, where, getDocs, limit, onSnapshot
} from 'firebase/firestore';
import { db } from './firebaseConfig'; // <-- CHECK THIS PATH

export default function AddProductScreen({ navigation }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [unit, setUnit] = useState(''); // Selected Unit name
  const [category, setCategory] = useState(''); // Selected Category name
  const [loading, setLoading] = useState(false);

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

  // Effect to load Categories
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

  // Effect to load Units
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

  // Function to check and add Unit/Category if not exists
  const checkAndAddLookup = async (collectionName, value) => {
    if (!value || typeof value !== 'string') return false;
    const trimmedValue = value.trim();
    if (!trimmedValue) return false;
    try {
      const lookupCollection = collection(db, collectionName);
      const q = query(lookupCollection, where("name", "==", trimmedValue), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.log(`Adding '${trimmedValue}' to collection '${collectionName}'`);
        await addDoc(lookupCollection, { name: trimmedValue });
        return true;
      } else {
        console.log(`'${trimmedValue}' already exists in collection '${collectionName}'`);
        return false;
      }
    } catch (error) {
      console.warn(`Error checking/adding '${trimmedValue}' to '${collectionName}':`, error);
      return false;
    }
  };

  // Function to save the new product
  const handleSaveProduct = async () => {
    if (!name || !price || !stock || !costPrice || !unit || !category) {
      Alert.alert('Lỗi', 'Vui lòng nhập/chọn đầy đủ thông tin.'); return;
    }
    setLoading(true);

    let newNumericId;
    let customId;
    const counterRef = doc(db, 'counters', 'productCounter');

    try {
      // Generate Custom ID
      try {
        const counterSnap = await getDoc(counterRef);
        let currentLastId = 0;
        if (counterSnap.exists()) {
          const data = counterSnap.data();
          if (typeof data.lastId === 'number' && !isNaN(data.lastId)) { currentLastId = data.lastId; }
        }
        newNumericId = currentLastId + 1;
        customId = 'SP' + String(newNumericId).padStart(6, '0');
      } catch (counterError) { throw new Error('Không thể đọc bộ đếm ID.'); }
      if (typeof newNumericId !== 'number' || isNaN(newNumericId)) { throw new Error('Không thể tạo ID sản phẩm.'); }

      // Unit and Category are already handled via selection/creation

      // Create new product object
      const newProduct = {
        id: customId, name: name, price: parseFloat(price), stock: parseInt(stock, 10),
        costPrice: parseFloat(costPrice), unit: unit, category: category,
      };

      // Batch write product and update counter
      const batch = writeBatch(db);
      const newProductRef = doc(collection(db, 'products'));
      batch.set(newProductRef, newProduct);
      batch.set(counterRef, { lastId: newNumericId }, { merge: true });
      await batch.commit();

      navigation.goBack();

    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm: ", error);
      Alert.alert('Lỗi', `Không thể thêm sản phẩm. ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Category Modal Handlers
  const handleSelectCategory = (selectedCategory) => {
    setCategory(selectedCategory.name); setCategoryModalVisible(false);
    setShowNewCategoryInput(false); setNewCategoryName('');
  };
  const handleCreateAndSelectCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) { Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm hàng mới.'); return; }
    setLoadingCategories(true); await checkAndAddLookup('categories', trimmedName); setLoadingCategories(false);
    setCategory(trimmedName); setCategoryModalVisible(false);
    setShowNewCategoryInput(false); setNewCategoryName('');
  };

  // Unit Modal Handlers
  const handleSelectUnit = (selectedUnit) => {
    setUnit(selectedUnit.name); setUnitModalVisible(false);
    setShowNewUnitInput(false); setNewUnitName('');
  };
  const handleCreateAndSelectUnit = async () => {
    const trimmedName = newUnitName.trim();
    if (!trimmedName) { Alert.alert('Lỗi', 'Vui lòng nhập tên đơn vị mới.'); return; }
    setLoadingUnits(true); await checkAndAddLookup('units', trimmedName); setLoadingUnits(false);
    setUnit(trimmedName); setUnitModalVisible(false);
    setShowNewUnitInput(false); setNewUnitName('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading} style={styles.backButton}>
             <Ionicons name="chevron-back-outline" size={32} color={loading ? '#AAA' : '#007AFF'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hàng hóa mới</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct} disabled={loading}>
             <Text style={styles.saveButtonText}>Lưu</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.form}>
          <Text style={styles.sectionTitle}>THÔNG TIN CƠ BẢN</Text>
          <View style={styles.imagePlaceholderContainer}>
             <View style={styles.imagePlaceholderView}>
                <Ionicons name="image" size={50} color="#CCC" />
             </View>
          </View>
          <Text style={styles.label}>Tên hàng hóa *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ví dụ: Ấm + phích ủ RĐ" />

          {/* Unit Picker */}
          <Text style={styles.label}>Đơn vị *</Text>
          <TouchableOpacity
            style={styles.pickerInput}
            onPress={() => { setUnitModalVisible(true); setShowNewUnitInput(false); setNewUnitName(''); }}
          >
            <Text style={unit ? styles.pickerText : styles.pickerPlaceholder}>{unit || 'Chọn đơn vị'}</Text>
            <Ionicons name="chevron-down" size={20} color="#888" />
          </TouchableOpacity>

          <Text style={styles.label}>Mã hàng</Text>
          <Text style={styles.staticId}>(Tự động tạo)</Text>
          <View style={styles.row}>
            <View style={styles.column}><Text style={styles.label}>Giá vốn *</Text><TextInput style={styles.input} value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" placeholder="0"/></View>
            <View style={styles.column}><Text style={styles.label}>Giá bán *</Text><TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0"/></View>
          </View>
          <View style={styles.row}>
             {/* Category Picker */}
            <View style={styles.column}>
              <Text style={styles.label}>Nhóm hàng *</Text>
              <TouchableOpacity
                style={styles.pickerInput}
                onPress={() => { setCategoryModalVisible(true); setShowNewCategoryInput(false); setNewCategoryName(''); }}
              >
                <Text style={category ? styles.pickerText : styles.pickerPlaceholder}>{category || 'Chọn nhóm hàng'}</Text>
                <Ionicons name="chevron-down" size={20} color="#888" />
              </TouchableOpacity>
            </View>
            <View style={styles.column}><Text style={styles.label}>Tồn kho *</Text><TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="0"/></View>
          </View>
          {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}
        </ScrollView>

        {/* Category Modal */}
        <Modal animationType="slide" transparent={true} visible={categoryModalVisible} onRequestClose={() => setCategoryModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}><Text style={styles.modalTitle}>Chọn nhóm hàng</Text><TouchableOpacity onPress={() => setCategoryModalVisible(false)}><Ionicons name="close-circle" size={30} color="#AAA" /></TouchableOpacity></View>
              {!showNewCategoryInput ? (<TouchableOpacity style={styles.createNewButton} onPress={() => setShowNewCategoryInput(true)}><Ionicons name="add-circle-outline" size={22} color="#007AFF" /><Text style={styles.createNewButtonText}>Tạo nhóm hàng mới</Text></TouchableOpacity>) : (<View style={styles.newCategoryInputContainer}><TextInput style={styles.newCategoryInput} placeholder="Nhập tên nhóm hàng mới..." value={newCategoryName} onChangeText={setNewCategoryName} autoFocus={true}/><TouchableOpacity style={styles.confirmNewCategoryButton} onPress={handleCreateAndSelectCategory} disabled={loadingCategories}>{loadingCategories ? <ActivityIndicator size="small" color="#FFF"/> : <Text style={styles.confirmNewCategoryButtonText}>Thêm</Text>}</TouchableOpacity><TouchableOpacity onPress={() => setShowNewCategoryInput(false)}><Ionicons name="close-circle-outline" size={26} color="#AAA" style={{marginLeft: 5}}/></TouchableOpacity></View>)}
              {loadingCategories && !showNewCategoryInput && <ActivityIndicator size="large" color="#007AFF" />}
              {!loadingCategories && !showNewCategoryInput && (<FlatList data={categories} keyExtractor={(item) => item.id} renderItem={({ item }) => (<TouchableOpacity style={styles.modalItem} onPress={() => handleSelectCategory(item)}><Text style={styles.modalItemText}>{item.name}</Text></TouchableOpacity>)} ListEmptyComponent={<Text style={styles.emptyListText}>Chưa có nhóm hàng nào.</Text>} style={{marginTop: 10}}/>)}
            </View>
          </View>
        </Modal>

        {/* Unit Modal */}
        <Modal animationType="slide" transparent={true} visible={unitModalVisible} onRequestClose={() => setUnitModalVisible(false)}>
           <View style={styles.modalOverlay}>
             <View style={styles.modalContent}>
               <View style={styles.modalHeader}><Text style={styles.modalTitle}>Chọn đơn vị</Text><TouchableOpacity onPress={() => setUnitModalVisible(false)}><Ionicons name="close-circle" size={30} color="#AAA" /></TouchableOpacity></View>
               {!showNewUnitInput ? (<TouchableOpacity style={styles.createNewButton} onPress={() => setShowNewUnitInput(true)}><Ionicons name="add-circle-outline" size={22} color="#007AFF" /><Text style={styles.createNewButtonText}>Tạo đơn vị mới</Text></TouchableOpacity>) : (<View style={styles.newCategoryInputContainer}><TextInput style={styles.newCategoryInput} placeholder="Nhập tên đơn vị mới..." value={newUnitName} onChangeText={setNewUnitName} autoFocus={true}/><TouchableOpacity style={styles.confirmNewCategoryButton} onPress={handleCreateAndSelectUnit} disabled={loadingUnits}>{loadingUnits ? <ActivityIndicator size="small" color="#FFF"/> : <Text style={styles.confirmNewCategoryButtonText}>Thêm</Text>}</TouchableOpacity><TouchableOpacity onPress={() => setShowNewUnitInput(false)}><Ionicons name="close-circle-outline" size={26} color="#AAA" style={{marginLeft: 5}}/></TouchableOpacity></View>)}
               {loadingUnits && !showNewUnitInput && <ActivityIndicator size="large" color="#007AFF" />}
               {!loadingUnits && !showNewUnitInput && (<FlatList data={units} keyExtractor={(item) => item.id} renderItem={({ item }) => (<TouchableOpacity style={styles.modalItem} onPress={() => handleSelectUnit(item)}><Text style={styles.modalItemText}>{item.name}</Text></TouchableOpacity>)} ListEmptyComponent={<Text style={styles.emptyListText}>Chưa có đơn vị nào.</Text>} style={{marginTop: 10}}/>)}
             </View>
           </View>
         </Modal>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', flex: 1 },
  saveButton: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  form: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, color: '#666', fontWeight: '500', marginTop: 20, marginBottom: 10 },
  imagePlaceholderContainer: { alignItems: 'flex-start', marginBottom: 15 },
  imagePlaceholderView: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#EFEFEF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  label: { fontSize: 15, fontWeight: '500', color: '#333', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  staticId: { fontSize: 16, color: '#555', backgroundColor: '#EFEFEF', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 0 }, // Removed marginBottom from row
  column: { flex: 1, marginRight: 8 },
  'column:last-child': { marginRight: 0 },
  pickerInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, minHeight: 45 },
  pickerText: { fontSize: 16, color: '#000' },
  pickerPlaceholder: { fontSize: 16, color: '#BBB' }, // Placeholder color
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
});