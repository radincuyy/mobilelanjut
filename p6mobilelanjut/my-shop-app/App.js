import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { store } from './src/store';

import ProductListScreen from './src/screens/ProductListScreen';
import CartScreen from './src/screens/CartScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen 
            name="Products" 
            component={ProductListScreen} 
            options={{ title: 'Daftar Produk' }}
          />
          <Tab.Screen 
            name="Cart" 
            component={CartScreen} 
            options={{ title: 'Keranjang' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </Provider>
  );
}