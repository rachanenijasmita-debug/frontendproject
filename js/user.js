const CURRENT_KEY = "expenseTrackerCurrentUser";
const currentUser = JSON.parse(localStorage.getItem(CURRENT_KEY) || "null");
if (!currentUser || currentUser.role !== "user") window.location.href = "index.html";

const uid = currentUser.email;
const key = (name) => `expenseTracker_${name}_${uid}`;

function read(name, fallback=[]) { return JSON.parse(localStorage.getItem(key(name)) || JSON.stringify(fallback)); }
function write(name, value) { localStorage.setItem(key(name), JSON.stringify(value)); }
function money(n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }
function today() { return new Date().toISOString().slice(0,10); }

let expenses = read("expenses");
let incomes = read("incomes");
let budgets = read("budgets");
let accounts = read("accounts", ["Cash", "Bank Account"]);
let recurring = read("recurring");

document.getElementById("userChip").textContent = currentUser.name;
document.getElementById("welcomeText").textContent = `Welcome, ${currentUser.name}!`;

function refresh() {
  renderDashboard(); renderExpenses(); renderIncome(); renderBudgets(); renderAccounts(); renderRecurring(); renderReports();
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    const section = document.getElementById(btn.dataset.section);
    section.classList.add("active");
    document.getElementById("pageTitle").textContent = btn.textContent;
  });
});

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem(CURRENT_KEY);
  window.location.href = "index.html";
};

function renderDashboard() {
  const income = incomes.reduce((s,x)=>s+Number(x.amount),0);
  const expense = expenses.reduce((s,x)=>s+Number(x.amount),0);
  document.getElementById("totalIncome").textContent = money(income);
  document.getElementById("totalExpense").textContent = money(expense);
  document.getElementById("balance").textContent = money(income-expense);
  document.getElementById("transactionCount").textContent = incomes.length + expenses.length;

  const totals = {};
  expenses.forEach(e => totals[e.category] = (totals[e.category] || 0) + Number(e.amount));
  const max = Math.max(...Object.values(totals), 1);
  document.getElementById("categoryChart").innerHTML = Object.keys(totals).length
    ? Object.entries(totals).map(([cat,val]) => `<div class="bar-row"><span>${cat}</span><div class="bar-track"><div class="bar-fill" style="width:${(val/max)*100}%"></div></div><b>${money(val)}</b></div>`).join("")
    : "<p class='empty'>No expenses yet.</p>";

  const all = [...expenses.map(x=>({...x,type:"Expense"})), ...incomes.map(x=>({...x,type:"Income"}))]
    .sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  document.getElementById("recentTransactions").innerHTML = all.length
    ? all.map(x=>`<div class="recent-item"><span>${x.date} · ${x.description}</span><strong class="${x.type==='Expense'?'expense-text':'income-text'}">${x.type==='Expense'?'-':'+'}${money(x.amount)}</strong></div>`).join("")
    : "<p class='empty'>No transactions yet.</p>";
}

document.getElementById("expenseDate").value = today();
document.getElementById("incomeDate").value = today();

function fillAccountSelect() {
  document.getElementById("expenseAccount").innerHTML = accounts.map(a=>`<option>${a}</option>`).join("");
}
fillAccountSelect();

document.getElementById("expenseForm").onsubmit = (e) => {
  e.preventDefault();
  expenses.push({
    id: Date.now(), amount:Number(document.getElementById("expenseAmount").value),
    category:document.getElementById("expenseCategory").value,
    description:document.getElementById("expenseDescription").value.trim(),
    date:document.getElementById("expenseDate").value,
    account:document.getElementById("expenseAccount").value
  });
  write("expenses", expenses); e.target.reset(); document.getElementById("expenseDate").value=today(); fillAccountSelect(); refresh();
};

function renderExpenses() {
  document.getElementById("expenseTable").innerHTML = expenses.length
    ? expenses.slice().reverse().map(x=>`<tr><td>${x.date}</td><td>${x.category}</td><td>${x.description}</td><td>${x.account}</td><td>${money(x.amount)}</td><td><button class="danger-btn" onclick="deleteExpense(${x.id})">Delete</button></td></tr>`).join("")
    : `<tr><td colspan="6" class="empty">No expenses found.</td></tr>`;
}
window.deleteExpense = (id) => { expenses=expenses.filter(x=>x.id!==id); write("expenses",expenses); refresh(); };

document.getElementById("incomeForm").onsubmit = (e) => {
  e.preventDefault();
  incomes.push({
    id: Date.now(), amount:Number(document.getElementById("incomeAmount").value),
    source:document.getElementById("incomeSource").value,
    description:document.getElementById("incomeDescription").value.trim(),
    date:document.getElementById("incomeDate").value
  });
  write("incomes", incomes); e.target.reset(); document.getElementById("incomeDate").value=today(); refresh();
};

function renderIncome() {
  document.getElementById("incomeTable").innerHTML = incomes.length
    ? incomes.slice().reverse().map(x=>`<tr><td>${x.date}</td><td>${x.source}</td><td>${x.description}</td><td>${money(x.amount)}</td><td><button class="danger-btn" onclick="deleteIncome(${x.id})">Delete</button></td></tr>`).join("")
    : `<tr><td colspan="5" class="empty">No income found.</td></tr>`;
}
window.deleteIncome = (id) => { incomes=incomes.filter(x=>x.id!==id); write("incomes",incomes); refresh(); };

document.getElementById("budgetForm").onsubmit = (e) => {
  e.preventDefault();
  const category=document.getElementById("budgetCategory").value;
  const amount=Number(document.getElementById("budgetAmount").value);
  const existing=budgets.find(b=>b.category===category);
  if(existing) existing.amount=amount; else budgets.push({category,amount});
  write("budgets",budgets); e.target.reset(); refresh();
};

function renderBudgets() {
  const spentBy = {};
  expenses.forEach(e=>spentBy[e.category]=(spentBy[e.category]||0)+Number(e.amount));
  document.getElementById("budgetList").innerHTML = budgets.length
    ? budgets.map((b,i)=>{const spent=spentBy[b.category]||0; const pct=Math.min(spent/b.amount*100,100); return `<div class="stat-card"><span>${b.category} Budget</span><strong>${money(spent)} / ${money(b.amount)}</strong><div class="progress"><div style="width:${pct}%"></div></div><small>${money(Math.max(b.amount-spent,0))} remaining</small><button class="danger-btn" onclick="deleteBudget(${i})">Delete</button></div>`}).join("")
    : `<div class="panel"><p class="empty">No budgets set yet.</p></div>`;
}
window.deleteBudget=(i)=>{budgets.splice(i,1);write("budgets",budgets);refresh();};

document.getElementById("accountForm").onsubmit=(e)=>{
  e.preventDefault(); const name=document.getElementById("accountName").value.trim();
  if(name && !accounts.includes(name)) accounts.push(name);
  write("accounts",accounts); e.target.reset(); fillAccountSelect(); refresh();
};
function renderAccounts(){
  document.getElementById("accountList").innerHTML=accounts.map(a=>{
    const spent=expenses.filter(e=>e.account===a).reduce((s,e)=>s+Number(e.amount),0);
    return `<div class="stat-card"><span>Account</span><strong>${a}</strong><small>Expenses: ${money(spent)}</small></div>`;
  }).join("");
}

document.getElementById("recurringForm").onsubmit=(e)=>{
  e.preventDefault();
  recurring.push({id:Date.now(),name:document.getElementById("recurringName").value.trim(),amount:Number(document.getElementById("recurringAmount").value),frequency:document.getElementById("recurringFrequency").value,date:document.getElementById("recurringDate").value});
  write("recurring",recurring); e.target.reset(); refresh();
};
function renderRecurring(){
  document.getElementById("recurringList").innerHTML=recurring.length
    ? recurring.map((r,i)=>`<div class="recent-item"><span><b>${r.name}</b> · ${r.frequency} · Due ${r.date}</span><span>${money(r.amount)} <button class="danger-btn" onclick="deleteRecurring(${i})">Delete</button></span></div>`).join("")
    : `<p class="empty">No recurring expenses yet.</p>`;
}
window.deleteRecurring=(i)=>{recurring.splice(i,1);write("recurring",recurring);refresh();};

function renderReports(){
  const income=incomes.reduce((s,x)=>s+Number(x.amount),0), expense=expenses.reduce((s,x)=>s+Number(x.amount),0);
  document.getElementById("reportIncome").textContent=money(income);
  document.getElementById("reportExpense").textContent=money(expense);
  document.getElementById("reportBalance").textContent=money(income-expense);
  const totals={}; expenses.forEach(e=>totals[e.category]=(totals[e.category]||0)+Number(e.amount));
  document.getElementById("reportCategories").innerHTML=Object.keys(totals).length
    ? Object.entries(totals).map(([c,v])=>`<div class="report-line"><span>${c}</span><b>${money(v)}</b></div>`).join("")
    : "<p class='empty'>No expense data available.</p>";
}

document.getElementById("exportBtn").onclick=()=>{
  const rows=[["Date","Type","Category/Source","Description","Amount","Account"]];
  expenses.forEach(x=>rows.push([x.date,"Expense",x.category,x.description,x.amount,x.account]));
  incomes.forEach(x=>rows.push([x.date,"Income",x.source,x.description,x.amount,""]));
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="expense_tracker_transactions.csv"; a.click();
  URL.revokeObjectURL(a.href);
};

refresh();
