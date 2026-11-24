/**
 * Katalog 50 Template Undangan Pernikahan Digital (Tren Indonesia 2021–2026)
 * Mapping deterministik per paket (tidak random):
 * - Sederhana : T01–T05 (5 template)
 * - Medium    : T01–T10 (10 template)
 * - Rich      : T01–T25 (25 template)
 * - Konglo    : T01–T50 (50 template)
 * Semua ornamen & ikon menggunakan SVG murni (tanpa emoji/simbol).
 */
(function (global) {
  'use strict';

  const TIER_LIMITS = {
    sederhana: 5,
    medium: 10,
    rich: 25,
    konglo: 50,
  };

  const MOTIF_MAP = {
    'Minimalist Clean': 'minimal',
    'Rustic & Botanical': 'botanical',
    'Floral Romantic': 'floral',
    'Jawa Modern': 'heritage',
    'Islamic & Syari': 'islamic',
    'Luxury Royal': 'royal',
  };

  const RAW_TEMPLATES = [
    // T01–T05: Paket Sederhana
    ['tpl-01', 'T01', 'Ivory Minimalist', 'Minimalist Clean', '#f8f5f0', '#ffffff', '#efe9e0', '#8c6d5a', '#6e8268', '#2c2420', '#756860', '#dfd5c9', 'serif'],
    ['tpl-02', 'T02', 'Sage Botanical', 'Rustic & Botanical', '#edf3ee', '#fcfefd', '#e1ece3', '#466b50', '#6c9175', '#1f2e23', '#566d5c', '#c2d6c7', 'sans'],
    ['tpl-03', 'T03', 'Blush Floral', 'Floral Romantic', '#fdf1f4', '#ffffff', '#f9e2e8', '#b85d69', '#6b8c6e', '#332024', '#7a5c63', '#eecad2', 'script'],
    ['tpl-04', 'T04', 'Joglo Kraton', 'Jawa Modern', '#f3ebe0', '#fffcf7', '#eadcc9', '#7c4a2d', '#8c7048', '#2d1e16', '#72594b', '#d9c4ae', 'classic'],
    ['tpl-05', 'T05', 'Emerald Syari', 'Islamic & Syari', '#ecf5f0', '#ffffff', '#dcf0e6', '#1f6f54', '#5c8f73', '#152b23', '#527065', '#b8ded0', 'serif'],

    // T06–T10: Tambahan Paket Medium
    ['tpl-06', 'T06', 'Monochrome Studio', 'Minimalist Clean', '#f1f3f5', '#ffffff', '#e5e7eb', '#1f2937', '#6b7280', '#111827', '#5b6472', '#d1d5db', 'sans'],
    ['tpl-07', 'T07', 'Terracotta Rustic', 'Rustic & Botanical', '#f9eee7', '#fffaf6', '#f2dfd3', '#b4533c', '#6e855c', '#381e18', '#7d5950', '#e6c5b8', 'serif'],
    ['tpl-08', 'T08', 'Lavender Watercolor', 'Floral Romantic', '#f4f0fb', '#ffffff', '#eae1f8', '#7c5ca8', '#68856d', '#271e36', '#6c5f82', '#dcd0ee', 'script'],
    ['tpl-09', 'T09', 'Sunda Siger Gold', 'Jawa Modern', '#f7f2e8', '#fffdf8', '#ede3cf', '#a1732c', '#6f8054', '#2e2417', '#75644f', '#e0d0b4', 'classic'],
    ['tpl-10', 'T10', 'Navy Gold Walimah', 'Islamic & Syari', '#ecf1f9', '#ffffff', '#dde6f5', '#1e3a6e', '#5a788f', '#16223b', '#556582', '#c4d2ea', 'serif'],

    // T11–T25: Tambahan Paket Rich
    ['tpl-11', 'T11', 'Champagne Silk', 'Minimalist Clean', '#f9f4ec', '#fffdf9', '#efe5d6', '#9e7c50', '#7a8769', '#2c2318', '#786a58', '#e5d8c3', 'serif'],
    ['tpl-12', 'T12', 'Eucalyptus Mist', 'Rustic & Botanical', '#ebf2ef', '#fafdfb', '#dce8e3', '#3b6356', '#678c7d', '#1a2b25', '#587068', '#c1d6cd', 'sans'],
    ['tpl-13', 'T13', 'Dusty Rose Garden', 'Floral Romantic', '#f9eef1', '#ffffff', '#f3dfe5', '#a95567', '#648269', '#331d22', '#7a5960', '#e8ccd3', 'script'],
    ['tpl-14', 'T14', 'Parang Maroon', 'Jawa Modern', '#f7ebeb', '#fffafa', '#eed9da', '#7b1e2b', '#876f4b', '#2c1115', '#70494f', '#e0bec3', 'classic'],
    ['tpl-15', 'T15', 'Madinah Pearl', 'Islamic & Syari', '#f5f7f1', '#ffffff', '#e8ede1', '#4d6b47', '#718c6a', '#1e2b1b', '#5e6e5a', '#d3ded0', 'serif'],
    ['tpl-16', 'T16', 'Nordic Sand', 'Minimalist Clean', '#f3efe9', '#fdfcfa', '#e7e0d6', '#6d5d4e', '#7c826e', '#28221c', '#73685e', '#dcd3c7', 'sans'],
    ['tpl-17', 'T17', 'Pampas Sunset', 'Rustic & Botanical', '#fbf1e6', '#fffcf8', '#f4e2cf', '#b86f38', '#7c8a5e', '#382414', '#7d5f49', '#ead1b8', 'script'],
    ['tpl-18', 'T18', 'Sky Blue Peony', 'Floral Romantic', '#edf4fb', '#ffffff', '#dce9f7', '#356696', '#5e856d', '#192a3b', '#566d85', '#c5daed', 'script'],
    ['tpl-19', 'T19', 'Solo Heritage', 'Jawa Modern', '#f2ece2', '#fcf9f3', '#e7dccb', '#5e432c', '#738058', '#261b12', '#6c5a4b', '#d6c8b4', 'classic'],
    ['tpl-20', 'T20', 'Olive Crescent', 'Islamic & Syari', '#f1f4eb', '#fcfdf9', '#e3e9d8', '#5b6b32', '#7a8c54', '#222813', '#646c4c', '#d2d9c0', 'serif'],
    ['tpl-21', 'T21', 'Pearl Editorial', 'Minimalist Clean', '#f6f7f8', '#ffffff', '#ebedf0', '#374151', '#64748b', '#111827', '#646d7a', '#e2e5e9', 'serif'],
    ['tpl-22', 'T22', 'Pine Forest', 'Rustic & Botanical', '#e7efea', '#f9fcfa', '#d7e5dd', '#2c5442', '#517a65', '#15271f', '#4f695d', '#bdd1c5', 'sans'],
    ['tpl-23', 'T23', 'Peach Blossom', 'Floral Romantic', '#fdf1eb', '#ffffff', '#f8e0d5', '#c96b4b', '#678768', '#382018', '#805d52', '#f0cfc0', 'script'],
    ['tpl-24', 'T24', 'Pendopo Gold', 'Jawa Modern', '#1c1713', '#27201a', '#342b23', '#d4af37', '#8c9c6b', '#f7efe3', '#c7b8a3', '#4f4032', 'classic'],
    ['tpl-25', 'T25', 'Midnight Teal Syari', 'Islamic & Syari', '#112024', '#192d33', '#223b42', '#2dd4bf', '#5eead4', '#ecfeff', '#9cc6ca', '#2d4e57', 'serif'],

    // T26–T50: Tambahan Paket Konglo
    ['tpl-26', 'T26', 'Obsidian Gold VIP', 'Luxury Royal', '#13101b', '#1d1829', '#29223b', '#f59e0b', '#fbbf24', '#faf5ff', '#c4b5d6', '#463763', 'serif'],
    ['tpl-27', 'T27', 'Royal Burgundy', 'Luxury Royal', '#201016', '#2d161f', '#3d1e2a', '#e87993', '#f4a2b4', '#fdf2f4', '#cfa8b2', '#572839', 'classic'],
    ['tpl-28', 'T28', 'Velvet Emerald', 'Luxury Royal', '#0f1f1a', '#162c25', '#1f3d33', '#eab308', '#6ee7b7', '#ecfdf5', '#9ec4b5', '#295244', 'serif'],
    ['tpl-29', 'T29', 'Platinum Vogue', 'Minimalist Clean', '#18181b', '#242429', '#303036', '#d4d4d8', '#a1a1aa', '#fafafa', '#a1a1aa', '#3f3f46', 'sans'],
    ['tpl-30', 'T30', 'Amethyst Palace', 'Luxury Royal', '#191228', '#251a3b', '#332452', '#c084fc', '#d8b4fe', '#f5f3ff', '#bba8db', '#483373', 'classic'],
    ['tpl-31', 'T31', 'Warm Espresso', 'Minimalist Clean', '#f1ebe4', '#fcf9f5', '#e6ddd3', '#5c4033', '#758268', '#261a14', '#6e5b51', '#d8cbc0', 'serif'],
    ['tpl-32', 'T32', 'Ubud Tropical', 'Rustic & Botanical', '#ecf4eb', '#fbfdfb', '#dcead9', '#2f6f4e', '#589470', '#172b20', '#506e5e', '#c2dbc9', 'sans'],
    ['tpl-33', 'T33', 'Sakura Kyoto', 'Floral Romantic', '#fdf3f5', '#ffffff', '#f8e2e7', '#d46a84', '#6d8c70', '#361f26', '#825d68', '#f0d0d8', 'script'],
    ['tpl-34', 'T34', 'Batik Sidoluhur', 'Jawa Modern', '#efe6da', '#fbf7f0', '#e3d5c3', '#8b4513', '#738255', '#2e1b0e', '#705643', '#d7c3ac', 'classic'],
    ['tpl-35', 'T35', 'Alhambra Ivory', 'Islamic & Syari', '#f6f2ea', '#ffffff', '#ebe3d3', '#b58938', '#6e8768', '#2c2416', '#756852', '#e1d7c0', 'serif'],
    ['tpl-36', 'T36', 'Misty Mauve', 'Floral Romantic', '#f4eef3', '#fdfbfd', '#eadfe8', '#8c5a73', '#6b8570', '#2e1f27', '#735d69', '#ddcdda', 'script'],
    ['tpl-37', 'T37', 'Cinnamon Clay', 'Rustic & Botanical', '#f6ece5', '#fffaf6', '#ebd9cd', '#9e5034', '#6d8259', '#331d14', '#785b4f', '#e2c7ba', 'sans'],
    ['tpl-38', 'T38', 'Sapphire Crown', 'Luxury Royal', '#10182b', '#182440', '#223257', '#60a5fa', '#93c5fd', '#eff6ff', '#9db4d4', '#2d406e', 'serif'],
    ['tpl-39', 'T39', 'Mint Pastel', 'Minimalist Clean', '#edf8f4', '#ffffff', '#dbf0e9', '#2b8a78', '#5fa696', '#16302b', '#53736d', '#c5e3dc', 'sans'],
    ['tpl-40', 'T40', 'Betawi Heritage', 'Jawa Modern', '#faf3e5', '#fffdf7', '#f1e4cb', '#b83b2b', '#6d8759', '#301612', '#785852', '#e9d3ba', 'classic'],
    ['tpl-41', 'T41', 'Coral Sunset', 'Floral Romantic', '#fdf0ed', '#ffffff', '#f8ddd7', '#d15a47', '#688a6e', '#381c17', '#825c55', '#f0ccc5', 'script'],
    ['tpl-42', 'T42', 'Bamboo Zen', 'Rustic & Botanical', '#eff3e9', '#fcfdf9', '#e1e8d6', '#5a7338', '#789452', '#212917', '#606c50', '#cfd9c0', 'sans'],
    ['tpl-43', 'T43', 'Rose Gold Noir', 'Luxury Royal', '#1a1417', '#261d21', '#34272d', '#e6a4b4', '#f3c4cf', '#fdf4f6', '#c2a3ac', '#4a353e', 'serif'],
    ['tpl-44', 'T44', 'Andalusian Blue', 'Islamic & Syari', '#edf3f8', '#ffffff', '#dce8f2', '#25638f', '#58829e', '#152938', '#546d80', '#c5dae7', 'serif'],
    ['tpl-45', 'T45', 'Gebyok Klasik', 'Jawa Modern', '#211913', '#2e231b', '#3b2e24', '#e0a96d', '#92a170', '#f7eee4', '#c4b19b', '#544031', 'classic'],
    ['tpl-46', 'T46', 'Alabaster Clean', 'Minimalist Clean', '#f7f8fa', '#ffffff', '#eceff2', '#495057', '#6c757d', '#212529', '#6a727a', '#dce1e6', 'sans'],
    ['tpl-47', 'T47', 'Wisteria Dream', 'Floral Romantic', '#f4effa', '#ffffff', '#e7ddf6', '#7c4dff', '#688c74', '#24193d', '#695c88', '#dad0f0', 'script'],
    ['tpl-48', 'T48', 'Cedar & Linen', 'Rustic & Botanical', '#f3ede6', '#fcfaf7', '#e7ded3', '#7a5c43', '#6b8061', '#2b2017', '#6e5e50', '#dcd1c3', 'serif'],
    ['tpl-49', 'T49', 'Quba Gold', 'Islamic & Syari', '#151e1a', '#1e2b25', '#283831', '#eab308', '#6ee7b7', '#f3faf6', '#a5bfb3', '#354d42', 'serif'],
    ['tpl-50', 'T50', 'Sultan Diamond', 'Luxury Royal', '#0d0f17', '#161926', '#212538', '#fbbf24', '#93c5fd', '#f8fafc', '#94a3b8', '#334155', 'classic'],
  ];

  const TEMPLATES = RAW_TEMPLATES.map(([id, code, name, category, bg, cardBg, softBg, accent, leaf, text, muted, border, font]) => ({
    id,
    code,
    name,
    category,
    motif: MOTIF_MAP[category] || 'floral',
    bg,
    cardBg,
    softBg,
    accent,
    leaf,
    text,
    muted,
    border,
    font,
  }));

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
