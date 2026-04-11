import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
  name: 'cart',              // (1) Isi nama slice
  initialState: {
    items: [],
    total: 0,                // (2) Nilai awal total
  },
  reducers: {
    addItem: (state, action) => {
      // (3) Push item baru ke state.items
      state.items.push(action.payload);
      // (4) Tambahkan harga ke total
      state.total += action.payload.price;
    },
    removeItem: (state, action) => {
      // (5) Filter items - hapus item dengan id dari action.payload
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    clearCart: (state) => {
      // (6) Reset state ke kondisi awal
      state.items = [];
      state.total = 0;
    }
  }
})

// (7) Export actions
export const { addItem, removeItem, clearCart } = cartSlice.actions;

// (8) Export reducer
export default cartSlice.reducer;