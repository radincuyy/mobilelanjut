import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { addItem } from '../store/cartSlice';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.name}>{product.name}</Text>
        <Text>Rp {product.price}</Text>
      </View>
      <Button 
        title="Add to Cart" 
        onPress={() => dispatch(addItem(product))} 
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
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2, // Shadow untuk Android
  },
  name: { fontWeight: 'bold', fontSize: 16 },
});

export default ProductCard;