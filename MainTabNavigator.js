import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import các màn hình Tab
import OverviewScreen from './OverviewScreen';
import HomeScreen from './HomeScreen'; // Hàng hóa
import SalesScreen from './SalesScreen';
import InvoicesScreen from './InvoicesScreen';
import MoreScreen from './MoreScreen'; // Tab Nhiều hơn
// 🚨 MÀN HÌNH MỚI CHO TAB KHO HÀNG
import InventoryAdjustmentScreen from './InventoryAdjustmentScreen'; 

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Hàng hóa"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Tổng quan') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'Hàng hóa') iconName = focused ? 'cube' : 'cube-outline';
          else if (route.name === 'Bán hàng') iconName = focused ? 'cart' : 'cart-outline';
          else if (route.name === 'Hóa đơn') iconName = focused ? 'document-text' : 'document-text-outline';
          // 🚨 ICON MỚI CHO TAB KHO HÀNG
          else if (route.name === 'Kho hàng') iconName = focused ? 'sync-circle' : 'sync-circle-outline'; 
          else if (route.name === 'Nhiều hơn') iconName = focused ? 'menu' : 'menu-outline';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
      })}
    >
      {/* KHAI BÁO CÁC MÀN HÌNH TAB */}
      <Tab.Screen name="Tổng quan" component={OverviewScreen} />
      <Tab.Screen name="Hàng hóa" component={HomeScreen} />
      <Tab.Screen name="Bán hàng" component={SalesScreen} />
      {/* 🚨 THÊM TAB KHO HÀNG */}
      <Tab.Screen name="Kho hàng" component={InventoryAdjustmentScreen} /> 
      <Tab.Screen name="Hóa đơn" component={InvoicesScreen} />
      <Tab.Screen name="Nhiều hơn" component={MoreScreen} />
    </Tab.Navigator>
  );
}

// StyleSheet cho PlaceholderScreen (Giữ lại để tránh lỗi nếu các file khác tham chiếu)
const styles = StyleSheet.create({
  // ... (Stylesheets)
});
