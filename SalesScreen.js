import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, onSnapshot, serverTimestamp,
  writeBatch, doc, increment, query, orderBy
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useMemo } from 'react'; // Import useMemo

// -------------------------------------------------------------------
// 1. COMPONENTS CON
// -------------------------------------------------------------------

// Component hiển thị sản phẩm trong danh sách chọn (ProductList)
const ProductListItem = ({ item, onPress }) => (
  <TouchableOpacity
    style={styles.productListItem}
    onPress={onPress}
    disabled={!item.stock || item.stock <= 0}
  >
    <View style={styles.itemImagePlaceholder}>
      <Ionicons name="cube-outline" size={24} color={item.stock > 0 ? "#888" : "#FF3B30"} />
    </View>
    <View style={styles.itemInfo}>
      <Text style={[styles.itemName, (!item.stock || item.stock <= 0) && { color: '#888' }]}>{item.name}</Text>
      <Text style={styles.itemSku}>Tồn: {item.stock || 0} {item.unit}</Text>
    </View>
    <View style={styles.itemStockInfo}>
      <Text style={styles.itemPrice}>{item.price ? item.price.toLocaleString('vi-VN') : 0} đ</Text>
      {item.stock <= 0 && <Text style={{ color: '#FF3B30', fontSize: 13, fontWeight: '500' }}>Hết hàng</Text>}
    </View>
  </TouchableOpacity>
);

// Component hiển thị sản phẩm trong giỏ hàng (Cart)
const CartItem = ({ item, onIncrease, onDecrease }) => (
  <View style={styles.cartItemContainer}>
    <View style={styles.itemInfo}>
      <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
      <Text style={styles.itemPriceSingle}>Giá: {item.product.price ? item.product.price.toLocaleString('vi-VN') : 0} đ</Text>
    </View>

    <View style={styles.quantityControl}>
      <TouchableOpacity onPress={onDecrease} style={styles.quantityButton}>
        <Ionicons name="remove-outline" size={20} color="#333" />
      </TouchableOpacity>
      <Text style={styles.quantityText}>{item.quantity}</Text>
      <TouchableOpacity onPress={onIncrease} style={styles.quantityButton}>
        <Ionicons name="add-outline" size={20} color="#333" />
      </TouchableOpacity>
    </View>

    <Text style={styles.itemTotalPrice}>
      {(item.product.price * item.quantity).toLocaleString('vi-VN')}
    </Text>
  </View>
);

// -------------------------------------------------------------------
// 2. MÀN HÌNH BÁN HÀNG CHÍNH
// -------------------------------------------------------------------

export default function SalesScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  // --- LOGIC HỖ TRỢ ---

  // Sử dụng useMemo để tính tổng tiền (hiệu suất tốt hơn)
  const total = useMemo(() => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity || 0), 0);
  }, [cart]);

  // Hàm tính tổng tiền (Giữ lại tên cũ để tương thích với handleCheckout)
  const calculateTotal = () => total;

  // Hàm giảm số lượng/xóa khỏi giỏ
  const handleDecreaseCartItem = (productToRemove) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.product.firestoreId === productToRemove.firestoreId);

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        if (updatedCart[existingItemIndex].quantity > 1) {
          updatedCart[existingItemIndex].quantity -= 1;
          return updatedCart;
        } else {
          return prevCart.filter(item => item.product.firestoreId !== productToRemove.firestoreId); 
        }
      }
      return prevCart;
    });
  };

  // 🔥 CHỈNH SỬA: Hàm xử lý tìm kiếm (Thêm productsSource để dùng trong useEffect)
  const handleSearch = (query, productsSource = products) => {
    setSearchQuery(query);
    if (!query) {
        setFilteredProducts(productsSource); // Hiển thị TẤT CẢ nếu query rỗng
    } else {
        const textData = query.toUpperCase();
        const filtered = productsSource.filter((item) => (item.name ? item.name.toUpperCase() : '').includes(textData));
        setFilteredProducts(filtered);
    }
  };

  // --- LOGIC FIREBASE & DATA FETCHING ---

  // 🔥 SỬA useEffect: Đọc sản phẩm và hiển thị ngay lần đầu
  useEffect(() => {
    setLoading(true);
    const productRef = query(collection(db, 'products'), orderBy('name', 'asc')); 
    
    const unsubscribe = onSnapshot(productRef, (querySnapshot) => {
        const productList = [];
        querySnapshot.forEach((doc) => {
            productList.push({ firestoreId: doc.id, ...doc.data() });
        });
        
        setProducts(productList); 
        
        // 🔥 Cập nhật danh sách hiển thị ban đầu bằng toàn bộ sản phẩm (vì searchQuery lúc này là rỗng)
        setFilteredProducts(productList); 
        
        setLoading(false);
    }, (error) => { 
        console.error("Lỗi đọc sản phẩm Sales:", error); 
        setLoading(false); 
        Alert.alert("Lỗi tải dữ liệu", "Không thể tải danh sách sản phẩm.");
    });
    return () => unsubscribe();
  }, []); // KHÔNG CÓ DEPENDENCY

  // THÊM useEffect: Chỉ chạy khi người dùng gõ tìm kiếm (searchQuery thay đổi)
  useEffect(() => {
    if(!loading) { // Chỉ chạy nếu đã tải xong lần đầu
      handleSearch(searchQuery);
    }
  }, [searchQuery, products]); // Cập nhật tìm kiếm khi gõ hoặc khi products thay đổi (do onSnapshot)


  // --- HÀM THÊM/TĂNG SỐ LƯỢNG ---
  const handleAddToCart = (productToAdd) => {
    if (!productToAdd.stock || productToAdd.stock <= 0) {
      Alert.alert("Hết hàng", `Sản phẩm "${productToAdd.name}" đã hết hàng.`);
      return;
    }

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.product.firestoreId === productToAdd.firestoreId);

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        const currentQuantityInCart = updatedCart[existingItemIndex].quantity;
        
        if (currentQuantityInCart + 1 > productToAdd.stock) {
          Alert.alert("Vượt tồn kho", `Chỉ còn ${productToAdd.stock} sản phẩm "${productToAdd.name}" trong kho.`);
          return prevCart;
        }
        updatedCart[existingItemIndex].quantity += 1;
        return updatedCart;
      } else {
        return [...prevCart, { product: productToAdd, quantity: 1 }];
      }
    });
  };

  // --- HÀM THANH TOÁN (SỬ DỤNG BATCH VÀ INCREMENT) ---
  const handleCheckout = async () => {
    const totalAmount = calculateTotal();
    if (cart.length === 0) { Alert.alert("Giỏ hàng trống", "Vui lòng chọn sản phẩm."); return; }

    // *Kiểm tra tồn kho lần cuối*
    for (const item of cart) {
      const productInfo = products.find(p => p.firestoreId === item.product.firestoreId);
      if (!productInfo || item.quantity > productInfo.stock) {
        Alert.alert("Lỗi tồn kho", `Số lượng "${item.product.name}" (${item.quantity}) vượt quá tồn kho (${productInfo?.stock || 0}). Vui lòng kiểm tra lại.`);
        return;
      }
    }

    setIsSaving(true);
    const batch = writeBatch(db);

    try {
      const invoiceItems = cart.map(item => ({
        productId: item.product.firestoreId,
        productIdDisplay: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        totalItemPrice: item.product.price * item.quantity,
        costPrice: item.product.costPrice || 0,
      }));

      const newInvoiceRef = doc(collection(db, 'invoices'));
      batch.set(newInvoiceRef, {
        createdAt: serverTimestamp(),
        items: invoiceItems,
        totalAmount: totalAmount,
      });

      for (const item of cart) {
        const productRef = doc(db, 'products', item.product.firestoreId);
        batch.update(productRef, {
          stock: increment(-item.quantity)
        });
      }

      await batch.commit();
      setCart([]);
      Alert.alert("Thành công", "Đã tạo hóa đơn và cập nhật kho.");

    } catch (error) {
      console.error("Lỗi khi tạo hóa đơn / cập nhật kho: ", error);
      Alert.alert("Lỗi", "Không thể hoàn tất thanh toán. Vui lòng thử lại.");
    } finally { 
      setIsSaving(false);
    }
  };


  if (loading) { return <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />; }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bán hàng</Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm hàng hóa..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Danh sách sản phẩm */}
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <ProductListItem
            item={item}
            onPress={() => handleAddToCart(item)}
          />
        )}
        keyExtractor={(item) => item.firestoreId}
        style={styles.productList}
        ListHeaderComponent={<Text style={styles.listHeader}>Chọn hàng hóa</Text>}
        ListEmptyComponent={<Text style={styles.emptyListText}>Không tìm thấy sản phẩm phù hợp.</Text>}
      />

      {/* Khu vực giỏ hàng */}
      {cart.length > 0 && (
        <View style={styles.cartSection}>
          <Text style={styles.listHeader}>Giỏ hàng ({cart.length} loại)</Text>
          <FlatList
            data={cart}
            renderItem={({ item }) => (
              <CartItem
                item={item}
                onIncrease={() => handleAddToCart(item.product)}
                onDecrease={() => handleDecreaseCartItem(item.product)}
              />
            )}
            keyExtractor={(item) => item.product.firestoreId}
            style={styles.cartList}
          />
        </View>
      )}

      {/* Footer */}
      {cart.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.totalText}>Tổng tiền: {total.toLocaleString('vi-VN')} đ</Text>
          <TouchableOpacity
            style={[styles.checkoutButton, isSaving && styles.checkoutButtonDisabled]}
            onPress={handleCheckout}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.checkoutButtonText}>Thanh toán</Text>}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// -------------------------------------------------------------------
// 3. STYLESHEET
// -------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EEE'},
  searchInput: { flex: 1, height: 40, backgroundColor: '#F0F0F0', borderRadius: 8, paddingLeft: 35, paddingRight: 15, fontSize: 16 },
  searchIcon: { position: 'absolute', left: 28, zIndex: 1 },

  listHeader: { fontSize: 16, fontWeight: '600', color: '#555', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#EFEFEF' },
  productList: { flex: 1 },
  emptyListText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#888'},

  // Style cho ProductListItem
  productListItem: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'center' },
  itemImagePlaceholder: { width: 40, height: 40, borderRadius: 4, backgroundColor: '#EFEFEF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemInfo: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 15, fontWeight: '500' },
  itemSku: { fontSize: 13, color: '#888', marginTop: 2 },
  itemStockInfo: { alignItems: 'flex-end' },
  itemPrice: { fontSize: 15, fontWeight: '500' },
  
  // Style cho khu vực giỏ hàng
  cartSection: { maxHeight: 300, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#DDD' },
  cartList: {},
  
  // Style cho CartItem
  cartItemContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#FFF' },
  itemPriceSingle: { fontSize: 14, color: '#555', marginTop: 2 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 6, marginHorizontal: 15 },
  quantityButton: { padding: 8 },
  quantityText: { fontSize: 16, fontWeight: 'bold', minWidth: 30, textAlign: 'center', paddingHorizontal: 5 },
  itemTotalPrice: { fontSize: 15, fontWeight: 'bold', minWidth: 80, textAlign: 'right', color: '#007AFF' },
  
  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  totalText: { fontSize: 18, fontWeight: 'bold' },
  checkoutButton: { backgroundColor: '#007AFF', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 8 },
  checkoutButtonDisabled: { backgroundColor: '#A9A9A9' },
  checkoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});