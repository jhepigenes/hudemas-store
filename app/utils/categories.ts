export const CATEGORY_CONFIG = [
    { id: 'all', dbValue: 'All' },
    { id: 'fruits', dbValue: 'Fruits' },
    { id: 'flowers', dbValue: 'Flowers' },
    { id: 'landscapes', dbValue: 'Landscapes' },
    { id: 'religious', dbValue: 'Religious' },
    { id: 'stillLife', dbValue: 'Still life' },
    { id: 'animals', dbValue: 'Animals / Birds' },
    { id: 'kids', dbValue: 'For kids' },
    { id: 'modern', dbValue: 'Modern' },
    { id: 'marine', dbValue: 'Ships' },
    { id: 'characters', dbValue: 'Characters' },
    { id: 'painters', dbValue: 'Famous painters' },
    { id: 'zodiac', dbValue: 'Zodiac' },
    { id: 'patterns', dbValue: '2-4 colors' },
    { id: 'allegories', dbValue: 'Allegory' },
    { id: 'accessories', dbValue: 'Needlework frames, magnifiers, accessories' }
] as const;

export type CategoryId = typeof CATEGORY_CONFIG[number]['id'];
