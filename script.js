let users = JSON.parse(localStorage.getItem('game_users') || '{}');
    let current = null;
    const defaultAdmin = { password: 'administrator@2025', winning: 0, bonus: 0, upi: '' };
    users['admin'] = users['admin'] || defaultAdmin;

    const authScreen = document.getElementById('auth-screen');
    const dashboard = document.getElementById('dashboard');
    const displayUser = document.getElementById('display-user');
    const balanceEl = document.getElementById('balance');
    const tempEl = document.getElementById('temp-balance');
    const adminSection = document.getElementById('admin-section');
    const adminBalanceEl = document.getElementById('admin-balance');
    const colorsContainer = document.getElementById('colors');
    const playBtn = document.getElementById('play-btn');
    const depositBtn = document.getElementById('deposit-btn');
    const depositMsg = document.getElementById('deposit-msg');
    const addFundsBtn = document.getElementById('add-funds-btn');

    // Signup
    document.getElementById('signup-form').addEventListener('submit', e => {
      e.preventDefault();
      const u = document.getElementById('signup-username').value.trim();
      const p = document.getElementById('signup-password').value;
      if (users[u]) return alert('User already exists');
      users[u] = { password: p, winning: 0, bonus: 50, temp: 0, upi: '' };
      localStorage.setItem('game_users', JSON.stringify(users));
      document.getElementById('signup-username').value = '';
      document.getElementById('signup-password').value = '';
      alert('User created! ₹50 bonus credited. Please login.');
    });

    // Login
    document.getElementById('login-form').addEventListener('submit', e => {
      e.preventDefault();
      const u = document.getElementById('login-username').value.trim();
      const p = document.getElementById('login-password').value;
      if (!users[u] || users[u].password !== p) return alert('Invalid credentials');
      current = u;
      showDashboard();
    });

    document.getElementById('logout-btn').onclick = () => {
      current = null;
      authScreen.classList.remove('hidden');
      dashboard.classList.add('hidden');
    };

    function showDashboard() {
      authScreen.classList.add('hidden');
      dashboard.classList.remove('hidden');
      displayUser.innerText = current;
      updateBalances();
      if (current === 'admin') adminSection.classList.remove('hidden');
      else adminSection.classList.add('hidden');
      renderColors();
      const uObj = users[current];
      if ((uObj.winning + uObj.bonus) === 0) alert('Add balance');
    }

    function updateBalances() {
      const uObj = users[current];
      balanceEl.innerText = (uObj.winning + uObj.bonus).toFixed(2);
      tempEl.innerText = uObj.temp.toFixed(2);
      adminBalanceEl.innerText = users['admin'].winning.toFixed(2);
    }

    function renderColors() {
      colorsContainer.innerHTML = '';
      const pick = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'].sort(() => 0.5 - Math.random()).slice(0, 4);
      pick.forEach(c => {
        const box = document.createElement('div');
        box.className = 'color-box bg-' + c + '-500';
        box.dataset.color = c;
        box.onclick = () => box.classList.toggle('selected');
        colorsContainer.appendChild(box);
      });
    }

    depositBtn.onclick = () => {
      depositMsg.innerText = '';
      addFundsBtn.classList.add('hidden');
      const amount = parseFloat(document.getElementById('play-amount').value);
      if (!amount || amount <= 0) return depositMsg.innerText = 'Enter a valid amount.';
      const uObj = users[current];
      if ((uObj.winning + uObj.bonus) < amount) {
        depositMsg.innerText = 'Insufficient funds.';
        addFundsBtn.classList.remove('hidden');
        return;
      }
      let from = uObj.bonus >= amount ? 'bonus' : 'winning';
      uObj[from] -= amount;
      uObj.temp = amount;
      saveAll();
      updateBalances();
      playBtn.disabled = false;
      alert('Play fee paid: ₹' + amount.toFixed(2));
    };

    addFundsBtn.onclick = () => {
      let amt = parseFloat(prompt("Enter amount to add:"));
      if (!amt || amt <= 0) return alert('Enter a valid amount.');
      users[current].bonus += amt;
      saveAll();
      updateBalances();
      depositMsg.innerText = '';
      addFundsBtn.classList.add('hidden');
      alert(`Added ₹${amt.toFixed(2)} to your balance.`);
    };

    playBtn.onclick = () => {
      const selected = Array.from(document.querySelectorAll('.selected')).map(b => b.dataset.color);
      if (selected.length < 3) return alert('Select at least 3 colors');
      const uObj = users[current];
      const fee = uObj.temp;
      if (!fee) return alert('Pay play fee first');
      const win = Math.random() < 0.5;
      if (win) {
        const winAmount = fee * 2;
        const commission = winAmount * 0.02;
        const payout = winAmount * 0.98;
        uObj.winning += payout;
        users['admin'].winning += commission;
        alert(`You won! You get ₹${payout.toFixed(2)} (after 2% commission).`);
      } else {
        users['admin'].winning += fee;
        alert(`You lost! ₹${fee.toFixed(2)} transferred to admin.`);
      }
      uObj.temp = 0;
      saveAll();
      updateBalances();
      renderColors();
      playBtn.disabled = true;
    };

    document.getElementById('withdraw-btn').onclick = () => {
      const uObj = users[current];
      const total = uObj.winning;
      if (total <= 0) return alert('No winning balance to withdraw');
      const upi = prompt('Enter your UPI ID to withdraw:');
      if (!upi || !/^[\w.-]+@[\w]+$/.test(upi)) return alert('Invalid UPI');
      alert(`Withdrawal of ₹${total.toFixed(2)} requested to ${upi}`);
      uObj.winning = 0;
      saveAll();
      updateBalances();
    };

    function saveAll() {
      localStorage.setItem('game_users', JSON.stringify(users));
    }