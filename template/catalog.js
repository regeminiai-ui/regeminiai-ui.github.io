/**
 * Katalog 50 Template Undangan Pernikahan Digital (Tren Indonesia 2021–2026)
 * Mapping deterministik per paket (tidak random):
 * - Sederhana : T01–T05 (5 template)
 * - Medium    : T01–T10 (10 template)
 * - Rich      : T01–T25 (25 template)
 * - Konglo    : T01–T50 (50 template)
 */
(function (global) {
  'use strict';

  const TIER_LIMITS = {
    sederhana: 5,
    medium: 10,
    rich: 25,
    konglo: 50,
  };

  const TEMPLATES = [
    // --- T01–T05: Paket Sederhana (5 Template) ---
    { id: 'tpl-01', code: 'T01', name: 'Ivory Minimalist', category: 'Minimalist Clean', bg: '#faf8f5', cardBg: '#ffffff', accent: '#8c6d5a', text: '#2c2420', muted: '#786b63', border: '#e5ddd5', font: 'serif', ornament: '✦' },
    { id: 'tpl-02', code: 'T02', name: 'Sage Botanical', category: 'Rustic & Botanical', bg: '#eef3ee', cardBg: '#fcfdfc', accent: '#4b6b53', text: '#223026', muted: '#5f7364', border: '#c7d8ca', font: 'sans', ornament: '🌿' },
    { id: 'tpl-03', code: 'T03', name: 'Blush Floral', category: 'Floral Romantic', bg: '#fdf2f4', cardBg: '#ffffff', accent: '#b85d69', text: '#352226', muted: '#7d5f66', border: '#f0cfd5', font: 'script', ornament: '❀' },
    { id: 'tpl-04', code: 'T04', name: 'Joglo Kraton', category: 'Jawa Modern', bg: '#f4ede4', cardBg: '#fffcf7', accent: '#7c4a2d', text: '#2d1e16', muted: '#755c4d', border: '#dbc8b6', font: 'classic', ornament: '❖' },
    { id: 'tpl-05', code: 'T05', name: 'Emerald Syari', category: 'Islamic & Syari', bg: '#edf5f1', cardBg: '#ffffff', accent: '#1f6f54', text: '#162c24', muted: '#547368', border: '#bfe0d2', font: 'serif', ornament: '☪' },

    // --- T06–T10: Tambahan Paket Medium (Total 10 Template) ---
    { id: 'tpl-06', code: 'T06', name: 'Monochrome Studio', category: 'Minimalist Clean', bg: '#f3f4f6', cardBg: '#ffffff', accent: '#111827', text: '#111827', muted: '#6b7280', border: '#d1d5db', font: 'sans', ornament: '◈' },
    { id: 'tpl-07', code: 'T07', name: 'Terracotta Rustic', category: 'Rustic & Botanical', bg: '#f9efe9', cardBg: '#fffaf7', accent: '#b4533c', text: '#3a1f19', muted: '#805a50', border: '#e8c9bf', font: 'serif', ornament: '🍂' },
    { id: 'tpl-08', code: 'T08', name: 'Lavender Watercolor', category: 'Floral Romantic', bg: '#f5f2fb', cardBg: '#ffffff', accent: '#7c5ca8', text: '#281f38', muted: '#6f6285', border: '#dfd4f0', font: 'script', ornament: '✿' },
    { id: 'tpl-09', code: 'T09', name: 'Sunda Siger Gold', category: 'Jawa Modern', bg: '#f7f3eb', cardBg: '#fffdf9', accent: '#a1732c', text: '#2f2518', muted: '#786752', border: '#e3d5bc', font: 'classic', ornament: '✧' },
    { id: 'tpl-10', code: 'T10', name: 'Navy Gold Walimah', category: 'Islamic & Syari', bg: '#eef2f9', cardBg: '#ffffff', accent: '#1e3a6e', text: '#16223b', muted: '#586885', border: '#c9d6eb', font: 'serif', ornament: '✦' },

    // --- T11–T25: Tambahan Paket Rich (Total 25 Template) ---
    { id: 'tpl-11', code: 'T11', name: 'Champagne Silk', category: 'Minimalist Clean', bg: '#f9f5ee', cardBg: '#fffdf9', accent: '#9e7c50', text: '#2d2419', muted: '#7a6c5a', border: '#e7dcc8', font: 'serif', ornament: '❖' },
    { id: 'tpl-12', code: 'T12', name: 'Eucalyptus Mist', category: 'Rustic & Botanical', bg: '#ecf2ef', cardBg: '#fafdfb', accent: '#3d6357', text: '#1b2b26', muted: '#5b726b', border: '#c5d7cf', font: 'sans', ornament: '🌿' },
    { id: 'tpl-13', code: 'T13', name: 'Dusty Rose Garden', category: 'Floral Romantic', bg: '#f9eff1', cardBg: '#ffffff', accent: '#a95567', text: '#331d22', muted: '#7d5c63', border: '#ead0d6', font: 'script', ornament: '❀' },
    { id: 'tpl-14', code: 'T14', name: 'Parang Maroon', category: 'Jawa Modern', bg: '#f7ecec', cardBg: '#fffafa', accent: '#7b1e2b', text: '#2c1115', muted: '#734b51', border: '#e2c2c6', font: 'classic', ornament: '❖' },
    { id: 'tpl-15', code: 'T15', name: 'Madinah Pearl', category: 'Islamic & Syari', bg: '#f6f7f2', cardBg: '#ffffff', accent: '#4d6b47', text: '#1f2b1c', muted: '#60705c', border: '#d6dfd1', font: 'serif', ornament: '☪' },
    { id: 'tpl-16', code: 'T16', name: 'Nordic Sand', category: 'Minimalist Clean', bg: '#f4f1ec', cardBg: '#fdfcfa', accent: '#6d5d4e', text: '#29231d', muted: '#756b61', border: '#dfd7cc', font: 'sans', ornament: '◈' },
    { id: 'tpl-17', code: 'T17', name: 'Pampas Sunset', category: 'Rustic & Botanical', bg: '#fbf2e8', cardBg: '#fffcf8', accent: '#b86f38', text: '#382414', muted: '#80624b', border: '#ecd5be', font: 'script', ornament: '🌾' },
    { id: 'tpl-18', code: 'T18', name: 'Sky Blue Wildflower', category: 'Floral Romantic', bg: '#eef5fb', cardBg: '#ffffff', accent: '#3b6e9c', text: '#1a2b3b', muted: '#5a7187', border: '#caddee', font: 'script', ornament: '✿' },
    { id: 'tpl-19', code: 'T19', name: 'Solo Heritage', category: 'Jawa Modern', bg: '#f2ede4', cardBg: '#fcf9f3', accent: '#5e432c', text: '#261b12', muted: '#6e5c4d', border: '#d8cbb8', font: 'classic', ornament: '✧' },
    { id: 'tpl-20', code: 'T20', name: 'Olive Crescent', category: 'Islamic & Syari', bg: '#f2f4ec', cardBg: '#fcfdf9', accent: '#5b6b32', text: '#232914', muted: '#666e4e', border: '#d5dbc4', font: 'serif', ornament: '☪' },
    { id: 'tpl-21', code: 'T21', name: 'Pearl Editorial', category: 'Minimalist Clean', bg: '#f7f7f7', cardBg: '#ffffff', accent: '#374151', text: '#111827', muted: '#6b7280', border: '#e5e7eb', font: 'serif', ornament: '✦' },
    { id: 'tpl-22', code: 'T22', name: 'Pine Forest', category: 'Rustic & Botanical', bg: '#e8efeb', cardBg: '#f9fcfa', accent: '#2c5442', text: '#162820', muted: '#516b5f', border: '#bfd2c7', font: 'sans', ornament: '🌲' },
    { id: 'tpl-23', code: 'T23', name: 'Peach Blossom', category: 'Floral Romantic', bg: '#fdf2ec', cardBg: '#ffffff', accent: '#c96b4b', text: '#382018', muted: '#826055', border: '#f2d3c4', font: 'script', ornament: '❀' },
    { id: 'tpl-24', code: 'T24', name: 'Pendopo Gold', category: 'Jawa Modern', bg: '#1e1915', cardBg: '#2a231d', accent: '#d4af37', text: '#f7efe3', muted: '#c2b39f', border: '#4d3f31', font: 'classic', ornament: '❖' },
    { id: 'tpl-25', code: 'T25', name: 'Midnight Teal Syari', category: 'Islamic & Syari', bg: '#132226', cardBg: '#1b3036', accent: '#5eead4', text: '#ecfeff', muted: '#99c4c8', border: '#2c4c54', font: 'serif', ornament: '☪' },

    // --- T26–T50: Tambahan Paket Konglo (Total 50 Template) ---
    { id: 'tpl-26', code: 'T26', name: 'Obsidian Gold VIP', category: 'Luxury Royal', bg: '#14111c', cardBg: '#1e192b', accent: '#f59e0b', text: '#faf5ff', muted: '#c4b5d6', border: '#463763', font: 'serif', ornament: '♛' },
    { id: 'tpl-27', code: 'T27', name: 'Royal Burgundy', category: 'Luxury Royal', bg: '#211016', cardBg: '#2e161f', accent: '#f4a2b4', text: '#fdf2f4', muted: '#cfa8b2', border: '#572839', font: 'classic', ornament: '✦' },
    { id: 'tpl-28', code: 'T28', name: 'Velvet Emerald', category: 'Luxury Royal', bg: '#0f1f1a', cardBg: '#162c25', accent: '#fbbf24', text: '#ecfdf5', muted: '#9ec4b5', border: '#295244', font: 'serif', ornament: '❖' },
    { id: 'tpl-29', code: 'T29', name: 'Platinum Vogue', category: 'Minimalist Clean', bg: '#18181b', cardBg: '#27272a', accent: '#e4e4e7', text: '#fafafa', muted: '#a1a1aa', border: '#3f3f46', font: 'sans', ornament: '◈' },
    { id: 'tpl-30', code: 'T30', name: 'Amethyst Palace', category: 'Luxury Royal', bg: '#1a1329', cardBg: '#261b3d', accent: '#c084fc', text: '#f5f3ff', muted: '#bba8db', border: '#483373', font: 'classic', ornament: '♛' },
    { id: 'tpl-31', code: 'T31', name: 'Warm Espresso', category: 'Minimalist Clean', bg: '#f2ece6', cardBg: '#fcf9f5', accent: '#5c4033', text: '#261a14', muted: '#705d53', border: '#dacdc2', font: 'serif', ornament: '✦' },
    { id: 'tpl-32', code: 'T32', name: 'Ubud Tropical', category: 'Rustic & Botanical', bg: '#edf4ec', cardBg: '#fbfdfb', accent: '#2f6f4e', text: '#172b20', muted: '#527060', border: '#c4dccb', font: 'sans', ornament: '🌴' },
    { id: 'tpl-33', code: 'T33', name: 'Sakura Kyoto', category: 'Floral Romantic', bg: '#fdf4f6', cardBg: '#ffffff', accent: '#d46a84', text: '#361f26', muted: '#85606b', border: '#f2d4dc', font: 'script', ornament: '🌸' },
    { id: 'tpl-34', code: 'T34', name: 'Batik Sidoluhur', category: 'Jawa Modern', bg: '#efe7dc', cardBg: '#fbf7f0', accent: '#8b4513', text: '#2e1b0e', muted: '#735845', border: '#d9c6b0', font: 'classic', ornament: '❖' },
    { id: 'tpl-35', code: 'T35', name: 'Alhambra Ivory', category: 'Islamic & Syari', bg: '#f6f3eb', cardBg: '#ffffff', accent: '#b58938', text: '#2c2416', muted: '#786b54', border: '#e3d9c3', font: 'serif', ornament: '☪' },
    { id: 'tpl-36', code: 'T36', name: 'Misty Mauve', category: 'Floral Romantic', bg: '#f4eff3', cardBg: '#fdfbfd', accent: '#8c5a73', text: '#2e1f27', muted: '#755f6b', border: '#dfd0d8', font: 'script', ornament: '✿' },
    { id: 'tpl-37', code: 'T37', name: 'Cinnamon Clay', category: 'Rustic & Botanical', bg: '#f6ede6', cardBg: '#fffaf6', accent: '#9e5034', text: '#331d14', muted: '#7a5d51', border: '#e4cabd', font: 'sans', ornament: '🍂' },
    { id: 'tpl-38', code: 'T38', name: 'Sapphire Crown', category: 'Luxury Royal', bg: '#10182b', cardBg: '#182440', accent: '#93c5fd', text: '#eff6ff', muted: '#9db4d4', border: '#2d406e', font: 'serif', ornament: '♛' },
    { id: 'tpl-39', code: 'T39', name: 'Mint Pastel', category: 'Minimalist Clean', bg: '#eef8f5', cardBg: '#ffffff', accent: '#2b8a78', text: '#16302b', muted: '#55756f', border: '#c7e5de', font: 'sans', ornament: '◈' },
    { id: 'tpl-40', code: 'T40', name: 'Betawi Heritage', category: 'Jawa Modern', bg: '#faf4e6', cardBg: '#fffdf7', accent: '#b83b2b', text: '#301612', muted: '#7a5a54', border: '#ebd6be', font: 'classic', ornament: '✧' },
    { id: 'tpl-41', code: 'T41', name: 'Coral Sunset', category: 'Floral Romantic', bg: '#fdf1ee', cardBg: '#ffffff', accent: '#d15a47', text: '#381c17', muted: '#855f58', border: '#f2cfc8', font: 'script', ornament: '❀' },
    { id: 'tpl-42', code: 'T42', name: 'Bamboo Zen', category: 'Rustic & Botanical', bg: '#f0f3ea', cardBg: '#fcfdf9', accent: '#5a7338', text: '#212917', muted: '#626e52', border: '#d1dbc2', font: 'sans', ornament: '🎋' },
    { id: 'tpl-43', code: 'T43', name: 'Rose Gold Noir', category: 'Luxury Royal', bg: '#1a1417', cardBg: '#261d21', accent: '#e6a4b4', text: '#fdf4f6', muted: '#c2a3ac', border: '#4a353e', font: 'serif', ornament: '♛' },
    { id: 'tpl-44', code: 'T44', name: 'Andalusian Blue', category: 'Islamic & Syari', bg: '#eef4f8', cardBg: '#ffffff', accent: '#25638f', text: '#152938', muted: '#566f82', border: '#c8dce8', font: 'serif', ornament: '☪' },
    { id: 'tpl-45', code: 'T45', name: 'Gebyok Klasik', category: 'Jawa Modern', bg: '#221a14', cardBg: '#2f241c', accent: '#e0a96d', text: '#f7eee4', muted: '#c4b19b', border: '#544031', font: 'classic', ornament: '❖' },
    { id: 'tpl-46', code: 'T46', name: 'Alabaster Clean', category: 'Minimalist Clean', bg: '#f8f9fa', cardBg: '#ffffff', accent: '#495057', text: '#212529', muted: '#6c757d', border: '#dee2e6', font: 'sans', ornament: '✦' },
    { id: 'tpl-47', code: 'T47', name: 'Wisteria Dream', category: 'Floral Romantic', bg: '#f4f0fa', cardBg: '#ffffff', accent: '#7c4dff', text: '#24193d', muted: '#6b5e8a', border: '#dcd2f2', font: 'script', ornament: '✿' },
    { id: 'tpl-48', code: 'T48', name: 'Cedar & Linen', category: 'Rustic & Botanical', bg: '#f3eee7', cardBg: '#fcfaf7', accent: '#7a5c43', text: '#2b2017', muted: '#706052', border: '#ded3c5', font: 'serif', ornament: '🌿' },
    { id: 'tpl-49', code: 'T49', name: 'Quba Gold', category: 'Islamic & Syari', bg: '#161f1b', cardBg: '#1f2c26', accent: '#eab308', text: '#f3faf6', muted: '#a5bfb3', border: '#354d42', font: 'serif', ornament: '☪' },
    { id: 'tpl-50', code: 'T50', name: 'Sultan Diamond', category: 'Luxury Royal', bg: '#0d0f17', cardBg: '#161926', accent: '#fbbf24', text: '#f8fafc', muted: '#94a3b8', border: '#334155', font: 'classic', ornament: '♛' },
  ];

  function getTemplatesForTier(tier) {
    const key = String(tier || 'sederhana').toLowerCase();
    const limit = TIER_LIMITS[key] || 5;
    return TEMPLATES.slice(0, limit);
  }

  function getTemplateByIdForTier(id, tier) {
    const allowed = getTemplatesForTier(tier);
    return allowed.find((t) => t.id === id) || allowed[0];
  }

  global.InvitationTemplates = {
    TIER_LIMITS,
    ALL: TEMPLATES,
    getTemplatesForTier,
    getTemplateByIdForTier,
  };
})(window);
