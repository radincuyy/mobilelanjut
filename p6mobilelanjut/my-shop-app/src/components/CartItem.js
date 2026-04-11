import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { removeItem } from '../store/cartSlice';

const CartItem = ({ item }) => {
  const dispatch = useDispatch();

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name} - Rp {item.price}</Text>
      <Button 
        title="Hapus" 
        color="red"
        onPress={() => dispatch(removeItem(item.id))} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
  },
  name: { fontSize: 14, flex: 1 },
});

export default CartItem;