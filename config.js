(function(root) {
  'use strict';
  const buildings = {
    hq:    { name: 'Nhà chính', icon: '⌂', hp: 1500, size: 62, wood: 80, stone: 60, coin: 35, description: 'Trái tim căn cứ. Mất Nhà chính sẽ bị loại.' },
    house: { name: 'Nhà ở', icon: '⌂', hp: 420, size: 38, wood: 30, stone: 12, coin: 8, description: 'Mỗi cấp tăng 20 máu tối đa và 0,25 hồi máu/giây.' },
    wall:  { name: 'Tường', icon: '▥', hp: 420, size: 32, wood: 10, stone: 6, coin: 2, description: 'Chặn nhân vật và quái. Thêm 210 máu mỗi cấp.' },
    gate:  { name: 'Cổng', icon: 'Π', hp: 480, size: 40, wood: 16, stone: 8, coin: 4, description: 'Chỉ chủ căn cứ đi qua. Chặn quái và người khác.' },
    tower: { name: 'Tháp canh', icon: '♜', hp: 620, size: 38, wood: 30, stone: 24, coin: 12, description: 'Bắn tự động. Tăng sát thương và tầm bắn theo cấp.' },
    farm:  { name: 'Ruộng', icon: '♧', hp: 320, size: 42, wood: 22, stone: 6, coin: 7, description: 'Sản xuất 1,5 lương thực/giây mỗi cấp.' },
    well:  { name: 'Giếng', icon: '◉', hp: 380, size: 36, wood: 18, stone: 20, coin: 7, description: 'Sản xuất 1,5 nước/giây mỗi cấp.' }
  };
  const C = {
    version: 3, title: 'SINH TỒN NGÀY TẬN THẾ',
    world: { width: 4800, height: 4000, buildRadius: 255, cell: 48 },
    timing: { day: 180, night: 120, warning: 20, resourceRespawn: 160, construction: 3 },
    limits: { monsters: 260, buildingsPerOwner: 50, projectiles: 500, maxLevel: 5, maxAI: 20, minAI: 15 },
    actor: { hp: 150, speed: 145, damage: 26, range: 74, cooldown: 0.55, gatherRange: 72, gatherCooldown: 0.7, gatherAmount: 9, consumption: 0.16, hungerGrace: 20 },
    initial: { wood: 60, stone: 40, water: 100, food: 100, coin: 0 },
    reward: { normal: 4, runner: 5, brute: 12, boss: 180 },
    monsters: {
      normal: { name: 'Quái thường', hp: 65, speed: 57, damage: 10, radius: 13, cooldown: 1.2, color: '#c1bd82' },
      runner: { name: 'Quái nhanh', hp: 43, speed: 99, damage: 8, radius: 10, cooldown: 0.85, color: '#b28fd4' },
      brute:  { name: 'Quái trâu', hp: 230, speed: 36, damage: 25, radius: 20, cooldown: 1.7, color: '#cc8160' },
      boss:   { name: 'KẺ NUỐT BÌNH MINH', hp: 2600, speed: 34, damage: 55, radius: 40, cooldown: 2, color: '#ef654a' }
    },
    buildings,
    levels: Array.from({length: 5}, (_, i) => ({ hp: 1 + i * 0.5, cost: 1 + i * 0.8, towerDamage: 20 + i * 11, towerRange: 245 + i * 22, towerCooldown: Math.max(0.42, 0.95 - i * 0.1), production: (i + 1) * 1.5 })),
    names: ['Tro Tàn', 'Bắc Đẩu', 'Hắc Ưng', 'Sương Mù', 'Cỏ Dại', 'Thiết Vệ', 'Mặt Trời', 'Lữ Khách', 'Bão Cát', 'Sói Xám', 'Hổ Phách', 'Lam Sơn', 'Đom Đóm', 'Bất Diệt', 'Sao Băng', 'Hải Đăng', 'Mộc Lan', 'Bạch Dương', 'Hỏa Vũ', 'Trăng Non'],
    colors: ['#73d3ad', '#efaa71', '#bda2ea', '#72b6d9', '#ed8197', '#c8ce76', '#76cabf', '#e5a8c9', '#9bb8ed', '#daaa60', '#a4d296', '#e29079', '#9ea2dd', '#d8c792', '#87bbce', '#c88be1', '#9cc3a4', '#c2a28a', '#d3949b', '#93acdb', '#c1c1c1'],
    score: { day: 120, kill: 12, boss: 800, level: 15 }
  };
  if (typeof module === 'object' && module.exports) module.exports = C;
  else root.SurvivalConfig = C;
})(typeof globalThis !== 'undefined' ? globalThis : this);
