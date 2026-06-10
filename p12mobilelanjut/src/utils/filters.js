export const IMAGE_FILTERS = [
  {
    id: 'normal',
    label: 'Normal',
    description: 'Tanpa overlay',
    overlayColor: 'transparent',
  },
  {
    id: 'bright',
    label: 'Bright',
    description: 'Lebih terang',
    overlayColor: 'rgba(255, 255, 255, 0.16)',
  },
  {
    id: 'contrast',
    label: 'Contrast',
    description: 'Lebih tegas',
    overlayColor: 'rgba(0, 0, 0, 0.18)',
  },
  {
    id: 'warm',
    label: 'Warm',
    description: 'Nuansa hangat',
    overlayColor: 'rgba(249, 115, 22, 0.16)',
  },
  {
    id: 'cool',
    label: 'Cool',
    description: 'Nuansa dingin',
    overlayColor: 'rgba(14, 165, 233, 0.15)',
  },
];

export function getFilterById(filterId) {
  return IMAGE_FILTERS.find((filter) => filter.id === filterId) || IMAGE_FILTERS[0];
}
