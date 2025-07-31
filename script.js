// --- Data & Session ---
let users = JSON.parse(localStorage.getItem('game_users') || '{}');
// Add ₹50 to all existing users once
Object.keys(users).forEach(u => {
  if (u !== 'admin') {
    users[u].bonus = (users[u].bonus || 0) + 50;
  }
});
localStorage.setItem('game_users', JSON.stringify(users));  // save updates

let current = localStorage.getItem('currentUser') || null;
let lastActive = Date.now();
const maxAdd = 100;
const defaultAdmin = { password: 'admin', winning: 0, bonus: 0, upi: '' };
users['admin'] = users['admin'] || defaultAdmin;
// ... rest of the existing script ...