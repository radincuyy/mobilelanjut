import React from 'react'
import { View, Text, Button } from 'react-native'
import { useDispatch, useSelector } from 'react-redux' // (1) Import hooks
import { clearCart } from '../store/cartSlice'

const CartScreen = () => {
  const dispatch = useDispatch()     // (2) Inisialisasi dispatch
  const items = useSelector(state => state.cart.items) // (3) Selector untuk items
  const total = useSelector(state => state.cart.total) // (4) Selector untuk total

  return (
    <View>
      <Text>Total: Rp {total}</Text>
      <Button
        title='Kosongkan'
        onPress={() => dispatch(clearCart())} // (5) Dispatch clearCart
      />
    </View>
  )
}

export default CartScreen