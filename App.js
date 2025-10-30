import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

// Import AuthProvider và useAuth từ AuthContext
import { AuthProvider, useAuth } from './AuthContext';

// Import các màn hình Auth
import IntroScreen from './IntroScreen';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen'; 

// Import Tab Navigator (Cần thiết cho MainAppStack)
import MainTabNavigator from './MainTabNavigator';

// Import các màn hình Stack trong ứng dụng
import AddProductScreen from './AddProductScreen';
import EditProductScreen from './EditProductScreen';
import InvoicesDetailScreen from './InvoicesDetailScreen';
import ChangePasswordScreen from './ChangePasswordScreen'; 
import ManageUsersScreen from './ManageUsersScreen'; 
import EditUserScreen from './EditUserScreen';
import StockLogScreen from './StockLogScreen'; // <-- MÀN HÌNH MỚI

const Stack = createNativeStackNavigator();

// Stack cho luồng chưa đăng nhập (bao gồm SignUp)
function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Intro">
      <Stack.Screen name="Intro" component={IntroScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// Stack cho luồng đã đăng nhập
function MainAppStack() {
  return (
    <Stack.Navigator>
      {/* Màn hình chính (Bottom Tabs) */}
      <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
      
      {/* Màn hình quản lý hàng hóa */}
      <Stack.Screen 
        name="AddProduct" 
        component={AddProductScreen} 
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen 
        name="EditProduct" 
        component={EditProductScreen} 
        options={{ headerShown: false, presentation: 'modal' }} 
      />
      
      {/* Màn hình Hóa đơn */}
      <Stack.Screen 
        name="InvoicesDetail" 
        component={InvoicesDetailScreen} 
        options={{ headerShown: false }} 
      />
      
      {/* Màn hình Tài khoản/Quản trị */}
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ManageUsers" 
        component={ManageUsersScreen} // Danh sách User
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="EditUser" 
        component={EditUserScreen} // Chỉnh sửa User
        options={{ headerShown: false, presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="StockLog" 
        component={StockLogScreen} // Lịch sử Nhập/Xuất
        options={{ headerShown: false }} 
      />
      
    </Stack.Navigator>
  );
}

// Navigator gốc quyết định hiển thị stack nào
function RootNavigator() {
  const { currentUser, loading } = useAuth(); 

  // Hiển thị loading nếu context chưa sẵn sàng
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Quyết định hiển thị AuthStack hay MainAppStack
  return (
    <NavigationContainer>
      {currentUser ? <MainAppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

// Component App gốc chỉ cần bọc mọi thứ trong AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
