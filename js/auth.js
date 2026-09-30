const USERS_KEY = "expenseTrackerUsers";
const CURRENT_KEY = "expenseTrackerCurrentUser";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function seedAdmin() {
  const users = getUsers();
  if (!users.some(u => u.email === "admin@gmail.com")) {
    users.push({name:"Administrator", email:"admin@gmail.com", password:"admin123", role:"admin", joined:new Date().toLocaleDateString()});
    saveUsers(users);
  }
}
seedAdmin();

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

loginTab.onclick = () => {
  loginTab.classList.add("active"); signupTab.classList.remove("active");
  loginForm.classList.remove("hidden"); signupForm.classList.add("hidden");
};
signupTab.onclick = () => {
  signupTab.classList.add("active"); loginTab.classList.remove("active");
  signupForm.classList.remove("hidden"); loginForm.classList.add("hidden");
};

loginForm.onsubmit = (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const user = getUsers().find(u => u.email === email && u.password === password);
  const msg = document.getElementById("loginMessage");
  if (!user) {
    msg.textContent = "Invalid email or password.";
    msg.className = "message error";
    return;
  }
  localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
  window.location.href = user.role === "admin" ? "admin.html" : "user.html";
};

signupForm.onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim().toLowerCase();
  const password = document.getElementById("signupPassword").value;
  const msg = document.getElementById("signupMessage");
  const users = getUsers();

  if (users.some(u => u.email === email)) {
    msg.textContent = "An account with this email already exists.";
    msg.className = "message error";
    return;
  }

  users.push({name, email, password, role:"user", joined:new Date().toLocaleDateString()});
  saveUsers(users);
  msg.textContent = "Account created successfully. Please login.";
  msg.className = "message success";
  signupForm.reset();
  setTimeout(() => loginTab.click(), 800);
};
