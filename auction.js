// ---------- CONFIG ----------
const INITIAL_ITEMS = [
  { id: 1, name: "Antique Clock", startingPrice: 1200, image: "images/clock.jpg" },
  { id: 2, name: "Telephone-1975", startingPrice: 950, image: "images/telephone.jpg" },
  { id: 3, name: "Antique Camera", startingPrice: 1800, image: "images/camera.jpg" }
];

const INITIAL_USERS = {
  admin: "adminpass",
  alice: "pass123",
  bob: "secret",
  charlie: "qwerty"
};

// ---------- STATE ----------
let items = INITIAL_ITEMS.map(i => ({ ...i, highestBid: i.startingPrice }));
let bids = [];
let users = { ...INITIAL_USERS };
let currentUser = null;

// Load from localStorage
const storedItems = JSON.parse(localStorage.getItem('auction_items'));
if (!storedItems || storedItems.length !== items.length) {
  localStorage.setItem('auction_items', JSON.stringify(items));
  localStorage.setItem('auction_bids', JSON.stringify([]));
  localStorage.setItem('users', JSON.stringify(users));
}

items = JSON.parse(localStorage.getItem('auction_items'));
bids = JSON.parse(localStorage.getItem('auction_bids'));
users = JSON.parse(localStorage.getItem('users'));
currentUser = localStorage.getItem('currentUser') || null;

// ---------- DOM ----------
const homePage = document.getElementById('home-page');
const appPage = document.getElementById('app-page');
const adminPage = document.getElementById('admin-page');

const itemsContainer = document.getElementById('items-container');
const itemSelect = document.getElementById('item');
const bidForm = document.getElementById('bid-form');
const loginWarning = document.getElementById('login-warning');
const welcomeMsg = document.getElementById('welcome-msg');
const logoutBtn = document.getElementById('logoutBtn');
const adminBtn = document.getElementById('adminBtn');

// Home buttons
const userLoginBtn = document.getElementById('userLoginBtn');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const signupBtn = document.getElementById('signupBtn');

// Auth modal
const modal = document.getElementById('auth-modal');
const closeModal = document.getElementById('close-modal');
const authForm = document.getElementById('auth-form');
const modalTitle = document.getElementById('modal-title');
const roleInput = document.getElementById('role');

const adminBidsList = document.getElementById('admin-bids-list');
const adminItemsContainer = document.getElementById('admin-items-container');
const addItemBtn = document.getElementById('addItemBtn');
const backBtn = document.getElementById('backBtn');
const resetAuctionBtn = document.getElementById('resetAuctionBtn');

let isLoginMode = true;

// ---------- RENDER ----------
function renderItems() {
  itemsContainer.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/150x100?text=No+Image';">
      <h3>${item.name}</h3>
      <p>Starting Price: ₹${item.startingPrice.toLocaleString('en-IN')}</p>
      <p class="highest-bid">Highest Bid: ₹${item.highestBid.toLocaleString('en-IN')}</p>
    `;
    itemsContainer.appendChild(div);
  });
}

function populateDropdown() {
  itemSelect.innerHTML = '';
  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    itemSelect.appendChild(option);
  });
}

function renderBids() {
  const bidsList = document.getElementById('bids-list');
  bidsList.innerHTML = '';
  [...bids].reverse().forEach(bid => {
    const item = items.find(i => i.id === bid.itemId);
    const li = document.createElement('li');
    li.textContent = `${item.name} — ₹${bid.amount.toLocaleString('en-IN')} by ${bid.user} at ${bid.time}`;
    bidsList.appendChild(li);
  });
}

// ---------- ADMIN RENDER ----------
function renderAdminBids() {
  adminBidsList.innerHTML = '';
  [...bids].reverse().forEach((bid, idx) => {
    const item = items.find(i => i.id === bid.itemId);
    const li = document.createElement('li');
    li.innerHTML = `${item.name} — ₹${bid.amount.toLocaleString('en-IN')} by ${bid.user} 
                    <button class="delete-bid" data-index="${bids.length-1-idx}">Delete</button>`;
    adminBidsList.appendChild(li);
  });
}

function renderAdminItems() {
  adminItemsContainer.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/150x100?text=No+Image';">
      <h3>${item.name}</h3>
      <p>Starting Price: ₹${item.startingPrice.toLocaleString('en-IN')}</p>
      <button class="edit-item" data-id="${item.id}">Edit</button>
      <button class="delete-item" data-id="${item.id}">Delete</button>
    `;
    adminItemsContainer.appendChild(div);
  });
}

// ---------- BIDDING ----------
bidForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!currentUser) {
    loginWarning.style.display = 'block';
    setTimeout(() => loginWarning.style.display = 'none', 3000);
    return;
  }
  const itemId = Number(itemSelect.value);
  const amount = Number(document.getElementById('amount').value);
  const item = items.find(i => i.id === itemId);
  if (!amount || amount <= item.highestBid) { 
    alert(`Bid must be higher than ₹${item.highestBid}`); 
    return; 
  }

  item.highestBid = amount;
  bids.push({ itemId, amount, user: currentUser, time: new Date().toLocaleString() });
  saveData();
  renderItems();
  populateDropdown();
  renderBids();
  document.getElementById('amount').value = '';
});

// ---------- AUTH ----------
function openModal(mode, role) {
  isLoginMode = mode === "login";
  modalTitle.textContent = isLoginMode 
    ? (role === "admin" ? "Admin Login" : "User Login") 
    : "Sign Up";
  roleInput.value = role;
  authForm.reset();
  modal.style.display = 'flex';
}

userLoginBtn.addEventListener("click", () => openModal("login", "user"));
adminLoginBtn.addEventListener("click", () => openModal("login", "admin"));
signupBtn.addEventListener("click", () => openModal("signup", "signup"));
closeModal.onclick = () => modal.style.display = 'none';
modal.addEventListener('click', e => { if(e.target===modal) modal.style.display='none'; });

authForm.addEventListener('submit', e => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const role = roleInput.value;

  if (isLoginMode) {
    // LOGIN MODE
    if (users[username] && users[username] === password) {
      if (role === "admin" && username !== "admin") {
        alert("Only the admin account can access admin login!");
        return;
      }
      currentUser = username;
      localStorage.setItem('currentUser', currentUser);
      modal.style.display = 'none';
      homePage.style.display = 'none';
      appPage.style.display = 'block';
      updateAuthUI();
    } else {
      alert("Invalid username or password!");
    }
  } else {
    // SIGN UP MODE
    if (users[username]) {
      alert("Username already exists!");
      return;
    }
    users[username] = password;
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = username;
    localStorage.setItem('currentUser', currentUser);
    alert("Signup successful! Logged in as " + username);
    modal.style.display = 'none';
    homePage.style.display = 'none';
    appPage.style.display = 'block';
    updateAuthUI();
  }
});

function updateAuthUI() {
  currentUser = localStorage.getItem('currentUser') || null;
  if (currentUser) {
    welcomeMsg.textContent = `Hello, ${currentUser}`;
    logoutBtn.style.display = 'inline-block';
    adminBtn.style.display = currentUser === 'admin' ? 'inline-block' : 'none';
  } else {
    welcomeMsg.textContent = '';
    logoutBtn.style.display = 'none';
    adminBtn.style.display = 'none';
  }
}

logoutBtn.onclick = () => {
  localStorage.removeItem('currentUser');
  updateAuthUI();
  appPage.style.display = 'none';
  homePage.style.display = 'block';
};

// ---------- ADMIN EVENTS ----------
adminBtn.onclick = () => {
  appPage.style.display = 'none';
  adminPage.style.display = 'block';
  renderAdminBids();
  renderAdminItems();
};

backBtn.onclick = () => {
  adminPage.style.display = 'none';
  appPage.style.display = 'block';
};

addItemBtn.onclick = () => {
  const name = document.getElementById('newItemName').value.trim();
  const price = Number(document.getElementById('newItemPrice').value);
  const image = document.getElementById('newItemImage').value.trim();
  if (!name || !price) { alert('Name and price required'); return; }

  const newItem = {
    id: items.length ? items[items.length - 1].id + 1 : 1,
    name, startingPrice: price, highestBid: price, image
  };
  items.push(newItem);
  saveData();
  renderAdminItems();
  renderItems();
  populateDropdown();
  alert('Item added!');
};

// Delete bid
document.addEventListener('click', e => {
  if (e.target.classList.contains('delete-bid')) {
    const index = Number(e.target.dataset.index);
    bids.splice(index, 1);
    saveData();
    renderAdminBids();
    renderBids();
  }
});

// Edit / Delete Item
document.addEventListener('click', e => {
  if (e.target.classList.contains('delete-item')) {
    const id = Number(e.target.dataset.id);
    items = items.filter(i => i.id !== id);
    saveData();
    renderAdminItems();
    renderItems();
    populateDropdown();
  } else if (e.target.classList.contains('edit-item')) {
    const id = Number(e.target.dataset.id);
    const item = items.find(i => i.id === id);
    const newName = prompt("New name:", item.name);
    const newPrice = prompt("New starting price:", item.startingPrice);
    const newImage = prompt("New image URL:", item.image);
    if (newName) item.name = newName;
    if (newPrice) item.startingPrice = Number(newPrice);
    if (newImage) item.image = newImage;
    if (item.highestBid < item.startingPrice) item.highestBid = item.startingPrice;
    saveData();
    renderAdminItems();
    renderItems();
    populateDropdown();
  }
});

// Reset Auction
resetAuctionBtn.onclick = () => {
  if (confirm("Are you sure? This will remove all bids and reset highest bids.")) {
    bids = [];
    items.forEach(i => i.highestBid = i.startingPrice);
    saveData();
    renderBids();
    renderItems();
    renderAdminBids();
  }
};

// ---------- SAVE DATA ----------
function saveData() {
  localStorage.setItem('auction_items', JSON.stringify(items));
  localStorage.setItem('auction_bids', JSON.stringify(bids));
  localStorage.setItem('users', JSON.stringify(users));
}

// ---------- INIT ----------
renderItems();
populateDropdown();
renderBids();
updateAuthUI();
