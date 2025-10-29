import React from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    SafeAreaView, 
    ScrollView,
    TouchableOpacity,
    StatusBar,
    FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Component hiển thị từng mặt hàng trong hóa đơn
const InvoicesItemDetail = ({ item }) => (
    <View style={detailStyles.itemRow}>
        <View style={detailStyles.itemLeft}>
            <Text style={detailStyles.itemName} numberOfLines={2}>{item.name}</Text>
            <Text style={detailStyles.itemSubText}>SL: {item.quantity} | Giá: {item.price.toLocaleString('vi-VN')} đ</Text>
        </View>
        <Text style={detailStyles.itemTotal}>
            {(item.price * item.quantity).toLocaleString('vi-VN')} đ
        </Text>
    </View>
);

export default function InvoicesDetailScreen({ route, navigation }) {
    // Lấy hóa đơn từ tham số truyền vào
    const { invoice } = route.params; 

    // Kiểm tra tính hợp lệ
    if (!invoice || !invoice.id) {
        return (
            <SafeAreaView style={detailStyles.container}>
                <Text style={detailStyles.errorText}>Không tìm thấy thông tin hóa đơn.</Text>
            </SafeAreaView>
        );
    }
    
    // Tính toán lại tổng số lượng
    const totalQuantity = (invoice.items || []).reduce((sum, item) => sum + item.quantity, 0);

    return (
        <SafeAreaView style={detailStyles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View style={detailStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={detailStyles.backButton}>
                    <Ionicons name="chevron-back-outline" size={30} color="#007AFF" />
                </TouchableOpacity>
                <Text style={detailStyles.headerTitle} numberOfLines={1}>Chi tiết Hóa đơn</Text>
                <View style={{width: 30}}/> {/* Spacer */}
            </View>

            <ScrollView contentContainerStyle={detailStyles.scrollContent}>
                
                {/* Thông tin chung */}
                <View style={detailStyles.infoCard}>
                    <Text style={detailStyles.sectionTitle}>THÔNG TIN CHUNG</Text>
                    <View style={detailStyles.row}><Text style={detailStyles.label}>Mã Hóa đơn</Text><Text style={detailStyles.value}>{invoice.id.substring(0, 10).toUpperCase()}...</Text></View>
                    <View style={detailStyles.row}><Text style={detailStyles.label}>Ngày tạo</Text><Text style={detailStyles.value}>{invoice.createdAt?.toDate().toLocaleString('vi-VN') || 'N/A'}</Text></View>
                    <View style={detailStyles.row}><Text style={detailStyles.label}>Tổng mặt hàng</Text><Text style={detailStyles.value}>{totalQuantity}</Text></View>
                </View>

                {/* Danh sách sản phẩm */}
                <View style={detailStyles.listCard}>
                    <Text style={detailStyles.sectionTitle}>SẢN PHẨM ({invoice.items?.length || 0})</Text>
                    
                    <FlatList
                        data={invoice.items || []}
                        renderItem={({ item }) => <InvoicesItemDetail item={item} />}
                        keyExtractor={(item, index) => item.productId + index}
                        scrollEnabled={false} // Vì đã nằm trong ScrollView cha
                        ListEmptyComponent={<Text style={detailStyles.emptyListText}>Hóa đơn không có sản phẩm nào.</Text>}
                    />
                </View>

            </ScrollView>

            {/* Footer Tổng kết */}
            <View style={detailStyles.footer}>
                <Text style={detailStyles.footerTitle}>TỔNG THANH TOÁN</Text>
                <Text style={detailStyles.footerTotal}>
                    {invoice.totalAmount ? invoice.totalAmount.toLocaleString('vi-VN') : 0} đ
                </Text>
            </View>
        </SafeAreaView>
    );
}

// --- StyleSheet Chi tiết ---
const detailStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F8FA' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', flex: 1 },
    scrollContent: { padding: 16 },
    sectionTitle: { fontSize: 14, color: '#888', fontWeight: 'bold', marginBottom: 10 },
    
    // Card chung
    infoCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    label: { fontSize: 15, color: '#666' },
    value: { fontSize: 15, fontWeight: '500', color: '#333' },

    // Card danh sách sản phẩm
    listCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7F7F7', alignItems: 'center' },
    itemLeft: { flex: 3, paddingRight: 10 },
    itemName: { fontSize: 15, fontWeight: '600' },
    itemSubText: { fontSize: 13, color: '#888', marginTop: 2 },
    itemTotal: { flex: 1, fontSize: 15, fontWeight: 'bold', color: '#007AFF', textAlign: 'right' },
    emptyListText: { textAlign: 'center', paddingVertical: 20, color: '#888' },

    // Footer Tổng kết
    footer: { backgroundColor: '#FFFFFF', padding: 20, borderTopWidth: 1, borderTopColor: '#DDD', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
    footerTotal: { fontSize: 24, fontWeight: 'bold', color: '#007AFF' },
    errorText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#FF3B30' },
});
