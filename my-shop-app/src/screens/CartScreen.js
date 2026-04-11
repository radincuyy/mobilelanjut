import React from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../store/cartSlice';
import CartItem from '../components/CartItem';

const CartScreen = () => {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const total = useSelector((state) => state.cart.total);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Total Belanja: Rp {total}</Text>
      
      <FlatList
        data={items}
        keyExtractor={(item, index) => item.id + index}
        renderItem={({ item }) => <CartItem item={item} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Keranjang masih kosong</Text>}
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <Button
            title='Kosongkan Keranjang'
            onPress={() => dispatch(clearCart())}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  emptyText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  footer: { marginTop: 20 }
});

export default CartScreen;