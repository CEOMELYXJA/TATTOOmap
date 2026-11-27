import { tattooWorks } from './tattoos.js';

// Keep existing destinations in order, then add the first 15 reviewed 2025 photos.
const first2025 = new Set([
  '001', '002', '003', '004', '005', '007', '008', '009',
  '010', '011', '012', '013', '014', '015', '016',
].map(id => `wix-upload-2025-${id}`));
const existing = tattooWorks.filter(work =>
  work.uploadYear === 2026 || work.id === 'wix-upload-2025-027');
export const worldWorks = existing.concat(tattooWorks.filter(work => first2025.has(work.id)));
