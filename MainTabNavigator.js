import React from 'react';
import { View, Text, StyleSheet } from 'react-native'; // Xóa Button
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import các hook và màn hình cần thiết
import HomeScreen from './HomeScreen';
import SalesScreen from './SalesScreen';
import InvoicesScreen from './InvoicesScreen';
import OverviewScreen from './OverviewScreen'; 
import MoreScreen from './MoreScreen'; // <-- IMPORT MÀN HÌNH MỚI

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
    return (
        <Tab.Navigator
            initialRouteName="Hàng hóa" 
            screenOptions={({ route }) => ({
                // Cấu hình icon cho từng tab
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Tổng quan') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    else if (route.name === 'Hàng hóa') iconName = focused ? 'cube' : 'cube-outline';
                    else if (route.name === 'Bán hàng') iconName = focused ? 'cart' : 'cart-outline';
                    else if (route.name === 'Hóa đơn') iconName = focused ? 'document-text' : 'document-text-outline';
                    else if (route.name === 'Nhiều hơn') iconName = focused ? 'menu' : 'menu-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                // Màu sắc của icon/label khi active/inactive
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: '#8E8E93',
                // Ẩn header mặc định
                headerShown: false,
            })}
        >
            {/* Khai báo các màn hình cho 5 tab */}
            <Tab.Screen name="Tổng quan" component={OverviewScreen} />
            <Tab.Screen name="Hàng hóa" component={HomeScreen} />
            <Tab.Screen name="Bán hàng" component={SalesScreen} />
            <Tab.Screen name="Hóa đơn" component={InvoicesScreen} />
            {/* SỬ DỤNG MÀN HÌNH MỚI */}
            <Tab.Screen name="Nhiều hơn" component={MoreScreen} />
        </Tab.Navigator>
    );
}

// Xóa StyleSheet cũ (để giữ cho file này sạch)
const styles = StyleSheet.create({});
