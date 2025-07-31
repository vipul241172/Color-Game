// --- Data & Session ---
let users       = JSON.parse(localStorage.getItem('game_users') || '{}');
let current     = localStorage.getItem('currentUser') || null;
let lastActive  = Date.now();
const maxAdd    = 1000;
const defaultAdmin = { password: 'admin', winning: 0, bonus: 0, upi: '' };
users['admin'] = users['admin'] || defaultAdmin;

// Auto-logout after 5min inactivity
['click','keypress'].forEach(e =>
  document.addEventListener(e, ()=> lastActive = Date.now())
);
setInterval(()=>{
  if(current && Date.now() - lastActive > 5*60*1000) {
    logout(); alert('Logged out due to inactivity.');
  }
}, 60*1000);

// Element refs
const authScreen   = document.getElementById('auth-screen');
const dashboard    = document.getElementById('dashboard');
const userSection  = document.getElementById('user-section');
const adminSection = document.getElementById('admin-section');
const displayUser  = document.getElementById('display-user');

// --- Handlers ---
// Reset password
document.getElementById('reset-link').onclick = e => {
  e.preventDefault();
  const u = prompt("Enter your username to reset password:");
  if(!u||!users[u]) return alert("User not found.");
  const newP = prompt("Enter your new password:");
  if(!newP) return alert("Password cannot be empty.");
  users[u].password=newP;
  localStorage.setItem('game_users', JSON.stringify(users));
  alert("Password reset! Please login with new password.");
};

// Signup
document.getElementById('signup-form').onsubmit = e=>{
  e.preventDefault();
  const u=document.getElementById('signup-username').value.trim();
  const p=document.getElementById('signup-password').value;
  if(users[u]) return alert('User already exists');
  users[u]={password:p,winning:0,bonus:50,temp:0,upi:''};
  localStorage.setItem('game_users', JSON.stringify(users));
  alert('User created! ₹50 bonus credited. Please login.');
};

// Login
document.getElementById('login-form').onsubmit = e=>{
  e.preventDefault();
  const u=document.getElementById('login-username').value.trim();
  const p=document.getElementById('login-password').value;
  if(!users[u]||users[u].password!==p) return alert('Invalid credentials');
  current=u; localStorage.setItem('currentUser', current);
  showDashboard();
};

// Logout
document.getElementById('logout-btn').onclick = logout;
function logout(){
  current=null;
  localStorage.removeItem('currentUser');
  authScreen.classList.remove('hidden');
  dashboard.classList.add('hidden');
}

// Persist session
window.onload = ()=>{
  if(current&&users[current]) showDashboard();
};

// Show dashboard
function showDashboard(){
  authScreen.classList.add('hidden');
  dashboard.classList.remove('hidden');
  displayUser.innerText = current;
  lastActive = Date.now();
  if(current==='admin'){
    userSection.classList.add('hidden');
    adminSection.classList.remove('hidden');
  } else {
    userSection.classList.remove('hidden');
    adminSection.classList.add('hidden');
    updateBalances();
    renderGame();
  }
}

// Balances
function updateBalances(){
  const u=users[current];
  document.getElementById('balance').innerText      = (u.winning+u.bonus).toFixed(2);
  document.getElementById('temp-balance').innerText = u.temp.toFixed(2);
  document.getElementById('admin-balance').innerText= users['admin'].winning.toFixed(2);
}

// Init game controls
function renderGame(){
  document.getElementById('mode').onchange   = renderColors;
  document.getElementById('deposit-btn').onclick = depositHandler;
  document.getElementById('play-btn').onclick    = playHandler;
  document.getElementById('add-funds-btn').onclick = addFundsHandler;
  renderColors();
}

// Render colors
function renderColors(){
  const count = parseInt(document.getElementById('mode').value);
  const cont  = document.getElementById('colors'); cont.innerHTML='';
  ['red','blue','green','yellow','purple','orange']
    .sort(()=>0.5-Math.random()).slice(0,count)
    .forEach(c=>{
      const box=document.createElement('div');
      box.className='color-box bg-'+c+'-500';
      box.onclick=()=>box.classList.toggle('selected');
      cont.appendChild(box);
    });
}

// Deposit
function depositHandler(){
  document.getElementById('deposit-msg').innerText = '';
  const fee = parseFloat(document.getElementById('play-amount').value);
  const u = users[current];
  if(!fee||fee<=0) {
    return document.getElementById('deposit-msg').innerText='Enter a valid amount.';
  }
  if((u.winning+u.bonus) < fee) {
    document.getElementById('deposit-msg').innerText = 'max. 1000 rupees add kar sakte he';
    document.getElementById('add-funds-btn').classList.remove('hidden');
    return;
  }
  const from = u.bonus>=fee?'bonus':'winning';
  u[from] -= fee; u.temp = fee;
  localStorage.setItem('game_users', JSON.stringify(users));
  updateBalances();
  document.getElementById('play-btn').disabled = false;
}

// Add funds (max ₹1000)
function addFundsHandler(){
  let amt = parseFloat(prompt(`Enter amount to add (max ₹${maxAdd}):`));
  if(!amt||amt<=0) return alert('Enter a valid amount.');
  if(amt > maxAdd) return alert(`Max. ₹${maxAdd} rupees add kar sakte he.`);
  users[current].bonus += amt;
  localStorage.setItem('game_users', JSON.stringify(users));
  updateBalances();
  document.getElementById('add-funds-btn').classList.add('hidden');
  alert(`₹${amt} added to your wallet.`);
}

// Play
function playHandler(){
  const fee = users[current].temp;
  const uObj= users[current];
  const win = Math.random() < 0.5;
  if(win){
    uObj.winning += fee * 2;
    const commission = (fee * 2) * 0.10;
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

// Withdraw UPI
document.getElementById('withdraw-btn').onclick = ()=>{
  const u = users[current];
  const available = u.winning + u.bonus;
  if(available <= 0) return alert('No balance to withdraw.');
  let amt = parseFloat(prompt(`Enter amount to withdraw (max ₹${available.toFixed(2)}):`));
  if(!amt || amt <=0 || amt > available) return alert('Invalid amount.');
  let rem = amt;
  if(u.bonus >= rem) {
    u.bonus -= rem;
  } else {
    rem -= u.bonus;
    u.bonus = 0;
    u.winning -= rem;
  }
  localStorage.setItem('game_users', JSON.stringify(users));
  updateBalances();
  alert(`₹${amt.toFixed(2)} withdrawn. Remaining balance ₹${(u.winning+u.bonus).toFixed(2)}.`);
};