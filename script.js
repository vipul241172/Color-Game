// Session persistence & inactivity logout
let users = JSON.parse(localStorage.getItem('game_users') || '{}');
let current = localStorage.getItem('currentUser') || null;
let lastActive = Date.now();

const defaultAdmin = { password: 'admin', winning: 0, bonus: 0, upi: '' };
users['admin'] = users['admin'] || defaultAdmin;

// Update lastActive on any click or keypress
['click','keypress'].forEach(evt => {
  document.addEventListener(evt, () => lastActive = Date.now());
});

function autoLogoutCheck() {
  if (current && Date.now() - lastActive > 5*60*1000) {
    logout();
    alert('Logged out due to inactivity.');
  }
}
setInterval(autoLogoutCheck, 60*1000);

// Elements
const authScreen = document.getElementById('auth-screen');
const dashboard = document.getElementById('dashboard');
const userSection = document.getElementById('user-section');
const adminSection = document.getElementById('admin-section');
const displayUser = document.getElementById('display-user');

// Reset password handler
document.getElementById('reset-link').onclick = e => {
  e.preventDefault();
  const u = prompt("Enter your username to reset password:");
  if (!u || !users[u]) return alert("User not found.");
  const newP = prompt("Enter your new password:");
  if (!newP) return alert("Password cannot be empty.");
  users[u].password = newP;
  localStorage.setItem('game_users', JSON.stringify(users));
  alert("Password reset! Please log in with your new password.");
};

// Signup
document.getElementById('signup-form').onsubmit = e => {
  e.preventDefault();
  const u = document.getElementById('signup-username').value.trim();
  const p = document.getElementById('signup-password').value;
  if (users[u]) return alert('User already exists');
  users[u] = { password: p, winning: 0, bonus: 50, temp: 0, upi: '' };
  localStorage.setItem('game_users', JSON.stringify(users));
  alert('User created! ₹50 bonus credited. Please login.');
};

// Login
document.getElementById('login-form').onsubmit = e => {
  e.preventDefault();
  const u = document.getElementById('login-username').value.trim();
  const p = document.getElementById('login-password').value;
  if (!users[u] || users[u].password !== p) return alert('Invalid credentials');
  current = u;
  localStorage.setItem('currentUser', current);
  showDashboard();
};

document.getElementById('logout-btn').onclick = () => logout();

function logout() {
  current = null;
  localStorage.removeItem('currentUser');
  authScreen.classList.remove('hidden');
  dashboard.classList.add('hidden');
}

// On load
window.onload = () => {
  if (current && users[current]) showDashboard();
};

function showDashboard() {
  authScreen.classList.add('hidden');
  dashboard.classList.remove('hidden');
  displayUser.innerText = current;
  lastActive = Date.now();
  if (current === 'admin') {
    userSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
  } else {
    userSection.classList.remove('hidden');
    adminSection.classList.add('hidden');
    updateBalances();
    renderGame();
  }
}

// Update balances
function updateBalances() {
  const uObj = users[current];
  document.getElementById('balance').innerText = (uObj.winning + uObj.bonus).toFixed(2);
  document.getElementById('temp-balance').innerText = uObj.temp.toFixed(2);
  document.getElementById('admin-balance').innerText = users['admin'].winning.toFixed(2);
}

// Render game controls
function renderGame() {
  renderColors();
  document.getElementById('deposit-btn').onclick = depositHandler;
  document.getElementById('play-btn').onclick = playHandler;
}

// Game logic
function renderColors() {
  const count = parseInt(document.getElementById('mode').value);
  const colorsContainer = document.getElementById('colors');
  colorsContainer.innerHTML = '';
  ['red','blue','green','yellow','purple','orange']
    .sort(() => 0.5 - Math.random())
    .slice(0, count)
    .forEach(c => {
      const box = document.createElement('div');
      box.className = 'color-box bg-'+c+'-500';
      box.dataset.color = c;
      box.onclick = () => box.classList.toggle('selected');
      colorsContainer.appendChild(box);
    });
}

function depositHandler() {
  document.getElementById('deposit-msg').innerText = '';
  document.getElementById('add-funds-btn').classList.add('hidden');
  const fee = parseFloat(document.getElementById('play-amount').value);
  const uObj = users[current];
  if (!fee || fee <= 0) return document.getElementById('deposit-msg').innerText = 'Enter a valid amount.';
  if ((uObj.winning + uObj.bonus) < fee) {
    document.getElementById('deposit-msg').innerText = 'Insufficient funds.';
    document.getElementById('add-funds-btn').classList.remove('hidden');
    return;
  }
  const from = uObj.bonus >= fee ? 'bonus' : 'winning';
  uObj[from] -= fee; uObj.temp = fee;
  localStorage.setItem('game_users', JSON.stringify(users));
  updateBalances();
  document.getElementById('play-btn').disabled = false;
}

function playHandler() {
  const fee = users[current].temp;
  const uObj = users[current];
  const win = Math.random() < 0.5;
  if (win) {
    uObj.winning += fee;
    users['admin'].winning -= fee;
    const commission = (fee * 2) * 0.20;
    uObj.winning -= commission;
    users['admin'].winning += commission;
    alert(`You won! You get ₹${fee.toFixed(2)}, commission ₹${commission.toFixed(2)} charged.`);
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

// Withdraw handler
document.getElementById('withdraw-btn').onclick = () => {
  alert("please register your UPI id first");
};

// Mode change
document.getElementById('mode').onchange = renderColors;
