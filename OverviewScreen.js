import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet, View, Text, SafeAreaView, StatusBar,
    ActivityIndicator, FlatList, ScrollView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'; 
import { db } from './firebaseConfig';

// --- Màn hình Tổng quan ---
export default function OverviewScreen() {
    // State cho thống kê sản phẩm
    const [totalProducts, setTotalProducts] = useState(0);
    const [totalStockValue, setTotalStockValue] = useState(0);
    const [totalStockCost, setTotalStockCost] = useState(0); // Tổng giá vốn tồn kho
    
    // State cho thống kê doanh thu và lợi nhuận
    const [dailyRevenue, setDailyRevenue] = useState([]); 
    const [totalGrossProfit, setTotalGrossProfit] = useState(0); // Tổng lợi nhuận gộp
    const [topSellingProducts, setTopSellingProducts] = useState([]); // Top sản phẩm bán chạy
    
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingRevenue, setLoadingRevenue] = useState(true);

    // 1. useEffect đọc Sản phẩm (Tính giá trị tồn kho theo giá bán và giá vốn)
    useEffect(() => {
        setLoadingProducts(true);
        const productRef = collection(db, 'products');
        const unsubscribe = onSnapshot(productRef, (querySnapshot) => {
            let productCount = 0;
            let stockValue = 0;
            let stockCost = 0;
            
            querySnapshot.forEach((doc) => {
                const product = doc.data();
                productCount++;
                const stock = product.stock || 0;
                
                if (product.price) { stockValue += product.price * stock; }
                if (product.costPrice) { stockCost += product.costPrice * stock; }

            });
            setTotalProducts(productCount);
            setTotalStockValue(stockValue);
            setTotalStockCost(stockCost);
            setLoadingProducts(false);
        });
        return () => unsubscribe(); 
    }, []);

    // 2. useEffect đọc Hóa đơn (Tính Doanh thu, Lợi nhuận và Top Sản phẩm)
    useEffect(() => {
        setLoadingRevenue(true);
        const invoiceRef = collection(db, 'invoices');
        const q = query(invoiceRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const revenueByDate = {};
            const productSalesCount = {};
            let profitTotal = 0;

            querySnapshot.forEach((doc) => {
                const invoice = doc.data();
                
                if (invoice.createdAt && invoice.totalAmount) {
                    const dateStr = invoice.createdAt.toDate().toISOString().split('T')[0];
                    revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + invoice.totalAmount;
                }

                if (invoice.items) {
                    let invoiceProfit = 0;
                    invoice.items.forEach(item => {
                        const quantity = item.quantity || 0;
                        const price = item.price || 0;
                        const cost = item.costPrice || 0;
                        
                        // Tính lợi nhuận gộp cho item này
                        const itemProfit = (price - cost) * quantity;
                        invoiceProfit += itemProfit;

                        // Tính tổng số lượng bán cho từng sản phẩm
                        const productId = item.productIdDisplay || item.productId;
                        productSalesCount[productId] = {
                            name: item.name,
                            quantity: (productSalesCount[productId]?.quantity || 0) + quantity
                        };
                    });
                    profitTotal += invoiceProfit;
                }
            });

            // Chuyển object doanh thu thành mảng
            const revenueArray = Object.keys(revenueByDate).map(date => ({
                date: date,
                revenue: revenueByDate[date],
            }));
            
            // Xử lý Top sản phẩm
            const topProductsArray = Object.values(productSalesCount)
                .sort((a, b) => b.quantity - a.quantity) // Sắp xếp giảm dần theo số lượng
                .slice(0, 5); // Chỉ lấy Top 5

            setDailyRevenue(revenueArray);
            setTotalGrossProfit(profitTotal);
            setTopSellingProducts(topProductsArray);
            setLoadingRevenue(false);
        });

        return () => unsubscribe(); 
    }, []);

    // Component để render một dòng doanh thu
    const renderRevenueItem = ({ item }) => (
        <View style={styles.revenueItem}>
            <Text style={styles.revenueDate}>{item.date}</Text>
            <Text style={styles.revenueAmount}>{item.revenue.toLocaleString('vi-VN')} đ</Text>
        </View>
    );

    // Component để render một dòng top sản phẩm
    const renderTopProductItem = ({ item, index }) => (
        <View style={styles.topProductItem}>
            <Text style={styles.topProductRank}>{index + 1}.</Text>
            <View style={styles.topProductInfo}>
                <Text style={styles.topProductName} numberOfLines={1}>{item.name}</Text>
            </View>
            <Text style={styles.topProductQuantity}>{item.quantity}</Text>
        </View>
    );


    if (loadingProducts || loadingRevenue) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    // --- PHẦN RENDER JSX ĐÃ ĐƯỢC CHỈNH SỬA CẤU TRÚC CARD ---
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tổng quan</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Thống kê tài sản kho */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionHeader}>THỐNG KÊ KHO HÀNG</Text>
                    {/* CARD 1: SỐ LOẠI HÀNG HÓA */}
                    <View style={styles.statCard}>
                        <View style={styles.statContent}>
                            <Text style={styles.statLabel}>Số loại hàng hóa</Text>
                            <Text style={styles.statValue}>{totalProducts}</Text>
                        </View>
                    </View>
                    {/* CARD 2: TỔNG GIÁ TRỊ TỒN KHO (GIÁ BÁN) */}
                    <View style={styles.statCard}>
                        <View style={styles.statContent}>
                            <Text style={styles.statLabel}>Tổng giá trị tồn kho (Giá bán)</Text>
                            <Text style={styles.statValue}>
                                {totalStockValue.toLocaleString('vi-VN')} đ
                            </Text>
                        </View>
                    </View>
                    {/* CARD 3: TỔNG GIÁ VỐN TỒN KHO */}
                    <View style={styles.statCard}>
                        <View style={styles.statContent}>
                            <Text style={styles.statLabel}>Tổng giá vốn tồn kho</Text>
                            <Text style={styles.statValue}>
                                {totalStockCost.toLocaleString('vi-VN')} đ
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Thống kê Doanh thu & Lợi nhuận */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionHeader}>KẾT QUẢ BÁN HÀNG</Text>
                    {/* CARD 4: TỔNG LỢI NHUẬN GỘP */}
                    <View style={[styles.statCard, styles.revenueCard]}>
                        <Ionicons name="trending-up-outline" size={24} color="#007AFF" style={styles.cardIcon}/>
                        <View style={styles.statContent}> {/* Wrap content */}
                            <Text style={styles.statLabel}>Tổng Lợi nhuận gộp</Text>
                            <Text style={styles.statValueProfit}>
                                {totalGrossProfit.toLocaleString('vi-VN')} đ
                            </Text>
                        </View>
                    </View>
                    {/* CARD 5: TỔNG DOANH THU */}
                    <View style={styles.statCard}>
                        <Ionicons name="document-text-outline" size={24} color="#666" style={styles.cardIcon}/>
                         <View style={styles.statContent}> {/* Wrap content */}
                            <Text style={styles.statLabel}>Tổng doanh thu (từ hóa đơn)</Text>
                            <Text style={styles.statValue}>
                                {dailyRevenue.reduce((sum, item) => sum + item.revenue, 0).toLocaleString('vi-VN')} đ
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Danh sách Doanh thu theo ngày */}
                <View style={styles.revenueContainer}>
                    <Text style={styles.sectionTitle}>DOANH THU & LỢI NHUẬN GẦN ĐÂY</Text>
                    {dailyRevenue.length > 0 ? (
                        <FlatList
                            data={dailyRevenue}
                            renderItem={renderRevenueItem}
                            keyExtractor={(item) => item.date}
                            scrollEnabled={false} 
                            ListFooterComponent={<View style={{height: 10}}/>}
                        />
                    ) : (
                        <Text style={styles.noDataText}>Chưa có dữ liệu doanh thu.</Text>
                    )}
                </View>

                {/* Top Sản phẩm bán chạy */}
                <View style={styles.revenueContainer}>
                    <Text style={styles.sectionTitle}>TOP 5 SẢN PHẨM BÁN CHẠY</Text>
                    {topSellingProducts.length > 0 ? (
                        <FlatList
                            data={topSellingProducts}
                            renderItem={renderTopProductItem}
                            keyExtractor={(item, index) => item.name + index}
                            scrollEnabled={false} 
                            ListFooterComponent={<View style={{height: 10}}/>}
                        />
                    ) : (
                        <Text style={styles.noDataText}>Chưa có dữ liệu bán hàng.</Text>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F8FA', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', },
    header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEE', },
    headerTitle: { fontSize: 22, fontWeight: 'bold', },
    scrollContainer: { paddingBottom: 20, }, 

    sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 10, marginTop: 10, paddingHorizontal: 16 },

    statsContainer: { paddingHorizontal: 16, paddingTop: 5, },
    statCard: {
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
        flexDirection: 'row', 
        alignItems: 'center', // Căn giữa nội dung thẻ theo chiều dọc
    },
    // THÊM STYLE MỚI ĐỂ CĂN CHỈNH NỘI DUNG BÊN TRONG CARD
    statContent: {
        flex: 1, // Dùng hết không gian còn lại
        flexDirection: 'row',
        justifyContent: 'space-between', // Đẩy label sang trái, value sang phải
        alignItems: 'center', // CĂN GIỮA VĂN BẢN (CHỮ VÀ SỐ) THEO CHIỀU DỌC
    },
    revenueCard: {
        backgroundColor: '#E0F0FF',
        borderLeftWidth: 5,
        borderLeftColor: '#007AFF',
    },
    cardIcon: {
        marginRight: 15,
        // Đảm bảo icon cũng được căn giữa trong thẻ
    },
    statLabel: { fontSize: 15, color: '#666', },
    statValue: { fontSize: 22, fontWeight: 'bold', color: '#000', },
    statValueProfit: { fontSize: 22, fontWeight: 'bold', color: '#28A745', },

    // Style cho phần Doanh thu và Top Sản phẩm
    revenueContainer: {
        marginTop: 15,
        marginHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
    },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#333' },
    noDataText: { textAlign: 'center', fontSize: 16, color: '#888', paddingVertical: 20, },

    // Item Doanh thu theo ngày
    revenueItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    revenueDate: { fontSize: 15, color: '#333', },
    revenueAmount: { fontSize: 15, fontWeight: '600', color: '#007AFF', },

    // Item Top Sản phẩm
    topProductItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F7F7F7',
    },
    topProductRank: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#888',
        width: 30,
    },
    topProductInfo: {
        flex: 1,
        paddingRight: 10,
    },
    topProductName: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    topProductQuantity: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
});
