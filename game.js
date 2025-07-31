// --- Data & Session ---
let users = JSON.parse(localStorage.getItem('game_users') || '{}');
let current = localStorage.getItem('currentUser') || null;
let lastActive = Date.now();

const maxAdd = 100; // max ₹100 per 12h
const defaultAdmin = { password: 'admin', winning: 0, bonus: 0, upi: '' };
users['admin'] = users['admin'] || defaultAdmin;

// Track last add-funds time per user
let lastAddTime = JSON.parse(localStorage.getItem('lastAddTime') || '{}');

// Auto-logout after 5min inactivity
['click','keypress'].forEach(e => document.addEventListener(e, () => lastActive = Date.now()));
setInterval(() => {
  if (current && Date.now() - lastActive > 5*60*1000) { logout(); alert('Logged out due to inactivity.'); }
}, 60*1000);

// Elements
const authScreen = document.getElementById('auth-screen');
const dashboard = document.getElementById('dashboard');
const userSection = document.getElementById('user-section');
const adminSection = document.getElementById('admin-section');
const displayUser = document.getElementById('display-user');

// Reset password
document.getElementById('reset-link').onclick = e => {
  e.preventDefault();
  const u = prompt("Enter your username to reset password:");
  if (!u || !users[u]) return alert("User not found.");
  const newP = prompt("Enter your new password:");
  if (!newP) return alert("Password cannot be empty.");
  users[u].password = newP;
  localStorage.setItem('game_users', JSON.stringify(users));
  alert("Password reset! Please login with new password.");
};

// Signup
document.getElementById('signup-form').onsubmit = e => {
  e.preventDefault();
  const u = document.getElementById('signup-username').value.trim();
  const p = document.getElementById('signup-password').value;
  if (users[u]) return alert('User already exists');
  users[u] = { password: p, winning: 0, bonus: 0, temp: 0, upi: '' };
  localStorage.setItem('game_users', JSON.stringify(users));
  alert('User created! Please login.');
};

// Login
document.getElementById('login-form').onsubmit = e => {
  e.preventDefault();
  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value;
  if (!users[u] || users[u].password !== p) return alert('Invalid credentials');
  current = u; localStorage.setItem('currentUser', current);
  showDashboard();
};

// Logout
document.getElementById('logout-btn').onclick = logout;
function logout(){
  current = null; localStorage.removeItem('currentUser');
  authScreen.classList.remove('hidden'); dashboard.classList.add('hidden');
}

// Persist session
window.onload = () => { if (current && users[current]) showDashboard(); };

// Show dashboard
function showDashboard(){
  authScreen.classList.add('hidden'); dashboard.classList.remove('hidden');
  displayUser.innerText = current; lastActive = Date.now();
  if (current === 'admin') {
    userSection.classList.add('hidden'); adminSection.classList.remove('hidden');
  } else {
    userSection.classList.remove('hidden'); adminSection.classList.add('hidden');
    updateBalances(); renderGame();
  }
}

// Update balances
function updateBalances(){
  const uObj = users[current];
  document.getElementById('balance').innerText = (uObj.winning + uObj.bonus).toFixed(2);
  document.getElementById('temp-balance').innerText = uObj.temp.toFixed(2);
  document.getElementById('admin-balance').innerText = users['admin'].winning.toFixed(2);
}

// Render game
function renderGame(){
  document.getElementById('mode').onchange = renderColors;
  document.getElementById('deposit-btn').onclick = depositHandler;
  document.getElementById('play-btn').onclick = playHandler;
  document.getElementById('add-funds-btn').onclick = addFundsHandler;
  renderColors();
}

// Render colors
function renderColors(){
  const count = parseInt(document.getElementById('mode').value);
  const cont = document.getElementById('colors'); cont.innerHTML = '';
  ['red','blue','green','yellow','purple','orange'].sort(() => 0.5-Math.random()).slice(0,count)
    .forEach(c => {
      const box = document.createElement('div');
      box.className = 'color-box bg-'+c+'-500';
      box.onclick = () => box.classList.toggle('selected');
      cont.appendChild(box);
    });
}

// Deposit handler
function depositHandler(){
  document.getElementById('deposit-msg').innerText = '';
  const fee = parseFloat(document.getElementById('play-amount').value);
  const uObj = users[current];
  if (!fee || fee <= 0) return document.getElementById('deposit-msg').innerText = 'Enter a valid amount.';
  if (uObj.winning + uObj.bonus < fee) return document.getElementById('deposit-msg').innerText = 'Insufficient balance.';
  uObj.temp = fee;
  localStorage.setItem('game_users', JSON.stringify(users));
  updateBalances();
  document.getElementById('play-btn').disabled = false;
}

// Add funds handler (max ₹100 per 12h)
function addFundsHandler(){
  const now = Date.now();
  const last = lastAddTime[current] || 0;
  if (now - last < 12*60*60*1000) {
    return alert('Next money add after 12 hours.');
  }
  let amt = parseFloat(prompt(`Enter amount to add (max ₹${maxAdd}):`));
  if (!amt || amt <= 0) return alert('Enter a valid amount.');
  if (amt > maxAdd) return alert(`You can only add up to ₹${maxAdd}.`);
  users[current].bonus += amt;
  lastAddTime[current] = now;
  localStorage.setItem('game_users', JSON.stringify(users));
  localStorage.setItem('lastAddTime', JSON.stringify(lastAddTime));
  updateBalances();
  document.getElementById('add-funds-btn').classList.add('hidden');
}

// Play handler
function playHandler(){
  const fee = users[current].temp;
  const uObj = users[current];
  const win = Math.random() < 0.5;
  if (win) {
    uObj.winning += fee*2;
    const commission = (fee*2)*0.10;
    users['admin'].winning += commission;
    alert(`You won! ₹${(fee*2).toFixed(2)} added. Commission ₹${commission.toFixed(2)} to admin.`);
  } else {
    users['admin'].winning += fee;
    alert("You lost!");
  }
  uObj.temp = 0;
  localStorage.setItem('game_users', JSON.stringify(users));
  updateBalances();
  renderColors();
  document.getElementById('play-btn').disabled = true;
}

// Withdraw handler message
document.getElementById('withdraw-btn').onclick = () => {
  alert("Ye amount abhi aap withdraw nahi kar sakte kyu ki abhi trial chal raha he, baad me jab upi activate hone ka option enable hoga tab aap withdraw kar sakte he, Thankyou");
};
