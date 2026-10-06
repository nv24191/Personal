(() => {
  const canvas = document.querySelector('#battlefield');
  const ctx = canvas.getContext('2d');
  const screen = document.querySelector('#screen');
  const screenTitle = document.querySelector('#screen-title');
  const screenText = document.querySelector('#screen-text');
  const startButton = document.querySelector('#start-button');
  const goldEl = document.querySelector('#gold');
  const ageEl = document.querySelector('#age');
  const enemyEl = document.querySelector('#enemy');
  const unitButtons = [...document.querySelectorAll('[data-unit]')];
  const ageNames = ['Stone Age', 'Medieval Age', 'Modern Age', 'Future Age'];
  const unitSets = [
    [{ name: 'Clubber', cost: 35, hp: 45, damage: 8, speed: 34, color: '#d99a63' }, { name: 'Slinger', cost: 55, hp: 28, damage: 13, speed: 25, color: '#b9c57a' }],
    [{ name: 'Knight', cost: 70, hp: 86, damage: 16, speed: 27, color: '#d9d7c6' }, { name: 'Archer', cost: 85, hp: 42, damage: 25, speed: 21, color: '#8eb18e' }],
    [{ name: 'Tank', cost: 130, hp: 190, damage: 34, speed: 16, color: '#7f9b9d' }, { name: 'Rifleman', cost: 105, hp: 63, damage: 38, speed: 25, color: '#d5b276' }],
    [{ name: 'Mech', cost: 180, hp: 280, damage: 58, speed: 13, color: '#b9d6d4' }, { name: 'Drone', cost: 155, hp: 82, damage: 72, speed: 29, color: '#f0d269' }]
  ];
  const state = { running: false, won: false, gold: 120, age: 0, base: 1000, enemy: 1000, units: [], enemyUnits: [], spawnTimer: 0, enemyTimer: 1.5, last: 0, elapsed: 0 };
  const W = 960, H = 540, ground = 400;
  canvas.width = W; canvas.height = H;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const currentUnits = () => unitSets[state.age];
  function showScreen(title, text, button = 'Begin battle') { screenTitle.textContent = title; screenText.textContent = text; startButton.textContent = button; screen.hidden = false; }
  function reset() { state.running = true; state.won = false; state.gold = 120; state.age = 0; state.base = 1000; state.enemy = 1000; state.units = []; state.enemyUnits = []; state.spawnTimer = 0; state.enemyTimer = 1.5; state.elapsed = 0; screen.hidden = true; updateUi(); }
  function addUnit(index) { const unit = currentUnits()[index]; if (!state.running || state.gold < unit.cost) return; state.gold -= unit.cost; state.units.push({ ...unit, x: 120, y: ground - 18, maxHp: unit.hp, cooldown: 0, side: 1 }); updateUi(); }
  function evolve() { const cost = 180 + state.age * 140; if (state.age < 3 && state.gold >= cost) { state.gold -= cost; state.age += 1; updateUi(); } }
  function updateUi() { goldEl.textContent = Math.floor(state.gold); ageEl.textContent = ageNames[state.age]; enemyEl.textContent = Math.max(0, Math.ceil(state.enemy)); const cost = 180 + state.age * 140; unitButtons.forEach((button, i) => { button.textContent = `${currentUnits()[i].name} · ${currentUnits()[i].cost}`; button.disabled = !state.running || state.gold < currentUnits()[i].cost; }); document.querySelector('#evolve').textContent = state.age === 3 ? 'Final age' : `Evolve · ${cost}`; document.querySelector('#evolve').disabled = !state.running || state.age === 3 || state.gold < cost; }
  function spawnEnemy() { const table = unitSets[clamp(Math.floor(state.elapsed / 35), 0, 3)]; const unit = table[Math.random() > .58 ? 1 : 0]; state.enemyUnits.push({ ...unit, x: 840, y: ground - 18, maxHp: unit.hp, cooldown: 0, side: -1 }); }
  function hitTest(a, b) { return Math.abs(a.x - b.x) < 42; }
  function tick(dt) { state.elapsed += dt; state.gold += dt * (2.7 + state.age * .8); state.spawnTimer -= dt; state.enemyTimer -= dt; if (state.spawnTimer <= 0) { state.spawnTimer = Math.max(2.1, 4.3 - state.age * .25); } if (state.enemyTimer <= 0) { spawnEnemy(); state.enemyTimer = Math.max(2.6, 5.4 - state.elapsed / 60); } const fight = (army, foes, targetBase, direction) => { army.forEach((unit) => { unit.cooldown -= dt; const foe = foes.find((candidate) => hitTest(unit, candidate)); if (foe) { if (unit.cooldown <= 0) { foe.hp -= unit.damage; unit.cooldown = .72; } } else { unit.x += unit.speed * dt * direction; } }); for (let i = foes.length - 1; i >= 0; i -= 1) { if (foes[i].hp <= 0) foes.splice(i, 1); } army.forEach((unit) => { if ((direction > 0 && unit.x > 820) || (direction < 0 && unit.x < 140)) state[targetBase] -= unit.damage * dt * .12; }); }; fight(state.units, state.enemyUnits, 'enemy', 1); fight(state.enemyUnits, state.units, 'base', -1); state.base = clamp(state.base, 0, 1000); state.enemy = clamp(state.enemy, 0, 1000); if (state.base <= 0 || state.enemy <= 0) { state.running = false; state.won = state.enemy <= 0; showScreen(state.won ? 'Victory' : 'Your base fell', state.won ? 'The future belongs to your army. Start a new battle to push farther.' : 'Rebuild your army and try a different evolution path.', 'Play again'); } updateUi(); }
  function draw() { const gradient = ctx.createLinearGradient(0, 0, 0, H); gradient.addColorStop(0, '#6b4b3c'); gradient.addColorStop(1, '#c39161'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#4b342f'; ctx.fillRect(0, ground, W, H - ground); for (let x = 0; x < W; x += 54) { ctx.fillStyle = x % 108 ? '#6e4938' : '#80533c'; ctx.fillRect(x, ground + 20, 31, 4); } ctx.fillStyle = '#d4a071'; ctx.fillRect(24, 255, 86, 145); ctx.fillRect(850, 255, 86, 145); ctx.fillStyle = '#4c3028'; ctx.fillRect(48, 300, 32, 100); ctx.fillRect(880, 300, 32, 100); ctx.fillStyle = '#f2c96f'; ctx.font = '700 18px sans-serif'; ctx.fillText(ageNames[state.age], 28, 42); ctx.fillStyle = '#fff3d6'; ctx.font = '700 14px sans-serif'; ctx.fillText('OCTO INDUSTRIES', W - 158, 42); const drawUnit = (unit) => { ctx.fillStyle = unit.color; ctx.beginPath(); ctx.arc(unit.x, unit.y - 18, 13, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(unit.x - 14, unit.y - 5, 28, 24); ctx.fillStyle = '#2b1d1e'; ctx.fillRect(unit.x - 18, unit.y - 38, 36, 4); ctx.fillStyle = '#7dc18e'; ctx.fillRect(unit.x - 18, unit.y - 38, 36 * clamp(unit.hp / unit.maxHp, 0, 1), 4); }; state.units.forEach(drawUnit); state.enemyUnits.forEach(drawUnit); ctx.fillStyle = '#f3c76b'; ctx.font = '700 13px sans-serif'; ctx.fillText('YOUR BASE', 35, 235); ctx.fillStyle = '#e8896e'; ctx.fillText('ENEMY BASE', 852, 235); }
  function frame(time) { const dt = Math.min(.05, (time - state.last) / 1000 || 0); state.last = time; if (state.running) tick(dt); draw(); requestAnimationFrame(frame); }
  unitButtons.forEach((button, i) => button.addEventListener('click', () => addUnit(i))); document.querySelector('#evolve').addEventListener('click', evolve); startButton.addEventListener('click', reset); showScreen('Age of War 1', 'Lead your army across four ages. Spend gold on units, evolve at the right moment, and destroy the enemy base.', 'Begin battle'); updateUi(); requestAnimationFrame(frame);
})();
