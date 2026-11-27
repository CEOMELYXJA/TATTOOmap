import { tattooWorks } from './tattoos.js';

// Keep the existing 2026 works and butterfly in place, then add the 2025 archive.
const existing = tattooWorks.filter(work =>
  work.uploadYear === 2026 || work.id === 'wix-upload-2025-027');
export const worldWorks = existing.concat(tattooWorks.filter(work =>
  work.uploadYear === 2025 && work.id !== 'wix-upload-2025-027'));
