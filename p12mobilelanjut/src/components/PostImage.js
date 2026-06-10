import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { getFilterById } from '../utils/filters';

export default function PostImage({ uri, filter = 'normal', style }) {
  const selectedFilter = getFilterById(filter);

  return (
    <View style={[styles.frame, style]}>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      <View
        pointerEvents="none"
        style={[styles.overlay, { backgroundColor: selectedFilter.overlayColor }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
