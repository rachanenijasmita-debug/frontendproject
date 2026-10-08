const CURRENT_KEY = "expenseTrackerCurrentUser";
const currentUser = JSON.parse(localStorage.getItem(CURRENT_KEY) || "null");
if (!currentUser || currentUser.role !== "admin") window.location.href = "index.html";

function users() { return JSON.parse(localStorage.getItem("expenseTrackerUsers") || "[]"); }
function money(n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }

function allTransactions() {
  const result=[];
  users().filter(u=>u.role==="user").forEach(u=>{
    const expenses=JSON.parse(localStorage.getItem(`expenseTracker_expenses_${u.email}`)||"[]");
    const incomes=JSON.parse(localStorage.getItem(`expenseTracker_incomes_${u.email}`)||"[]");
    expenses.forEach(x=>result.push({user:u.name,type:"Expense",date:x.date,category:x.category,amount:Number(x.amount)}));
    incomes.forEach(x=>result.push({user:u.name,type:"Income",date:x.date,category:x.source,amount:Number(x.amount)}));
  });
  return result.sort((a,b)=>b.date.localeCompare(a.date));
}

function refreshAdmin(){
  const us=users().filter(u=>u.role==="user"), tx=allTransactions();
  document.getElementById("adminUsers").textContent=us.length;
  document.getElementById("adminExpense").textContent=money(tx.filter(x=>x.type==="Expense").reduce((s,x)=>s+x.amount,0));
  document.getElementById("adminIncome").textContent=money(tx.filter(x=>x.type==="Income").reduce((s,x)=>s+x.amount,0));
  document.getElementById("adminTransactionsCount").textContent=tx.length;

  document.getElementById("usersTable").innerHTML=us.length
    ? us.map(u=>`<tr><td>${u.name}</td><td>${u.email}</td><td>${u.joined}</td></tr>`).join("")
    : `<tr><td colspan="3" class="empty">No registered users yet.</td></tr>`;

  document.getElementById("adminTransactionsTable").innerHTML=tx.length
    ? tx.map(x=>`<tr><td>${x.user}</td><td>${x.type}</td><td>${x.date}</td><td>${x.category}</td><td>${money(x.amount)}</td></tr>`).join("")
    : `<tr><td colspan="5" class="empty">No transactions yet.</td></tr>`;
}

document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".page-section").forEach(s=>s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.section).classList.add("active");
    document.getElementById("adminTitle").textContent=btn.textContent;
  };
});
document.getElementById("adminLogout").onclick=()=>{localStorage.removeItem(CURRENT_KEY);window.location.href="index.html";};
refreshAdmin();
