const USERS = {
  user: { password: "User@123", name: "User", role: "Personal account" },
};

const CATEGORY_CONFIG = {
  Salary: { symbol: "₹", color: "#1aaa7a", type: "income" },
  Freelance: { symbol: "F", color: "#3d8bfd", type: "income" },
  Investment: { symbol: "↗", color: "#8e68d4", type: "income" },
  Other: { symbol: "•", color: "#70808f", type: "both" },
  Food: { symbol: "F", color: "#ef6a6a", type: "expense" },
  Housing: { symbol: "H", color: "#3d8bfd", type: "expense" },
  Transport: { symbol: "T", color: "#f3a93b", type: "expense" },
  Shopping: { symbol: "S", color: "#8e68d4", type: "expense" },
  Bills: { symbol: "B", color: "#e8813b", type: "expense" },
  Health: { symbol: "+", color: "#e65777", type: "expense" },
  Entertainment: { symbol: "E", color: "#3bb7a0", type: "expense" },
};

const state = {
  user: null,
  transactions: [],
  month: new Date().toISOString().slice(0, 7),
  search: "",
  type: "all",
  theme: localStorage.getItem("pennypilot-theme") || "light",
  page: "overview",
  selectedCashFlow: null,
  selectedCategory: null,
};

const el = (id) => document.getElementById(id);
const loginView = el("loginView");
const appView = el("appView");
const transactionDialog = el("transactionDialog");
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
let cashFlowTargets = [];
let categoryTargets = [];

function storageKey(username) {
  return `pennypilot-v2-transactions-${username}`;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function seededTransactions() {
  const current = new Date();
  const y = current.getFullYear();
  const m = String(current.getMonth() + 1).padStart(2, "0");
  const date = (day) => `${y}-${m}-${String(day).padStart(2, "0")}`;
  return [
    { id: makeId(), description: "Monthly salary", amount: 65000, category: "Salary", date: date(1), type: "income" },
    { id: makeId(), description: "Apartment rent", amount: 18000, category: "Housing", date: date(2), type: "expense" },
    { id: makeId(), description: "Grocery shopping", amount: 4250, category: "Food", date: date(5), type: "expense" },
    { id: makeId(), description: "Freelance project", amount: 12000, category: "Freelance", date: date(8), type: "income" },
    { id: makeId(), description: "Electricity bill", amount: 2100, category: "Bills", date: date(10), type: "expense" },
    { id: makeId(), description: "Weekend movie", amount: 1250, category: "Entertainment", date: date(12), type: "expense" },
    { id: makeId(), description: "Fuel", amount: 2800, category: "Transport", date: date(15), type: "expense" },
  ];
}

function loadTransactions() {
  const saved = localStorage.getItem(storageKey(state.user));
  if (saved) return JSON.parse(saved);
  const seeded = seededTransactions();
  localStorage.setItem(storageKey(state.user), JSON.stringify(seeded));
  return seeded;
}

function saveTransactions() {
  localStorage.setItem(storageKey(state.user), JSON.stringify(state.transactions));
}

function showToast(message) {
  const toast = el("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function signIn(username, password) {
  const account = USERS[username];
  if (!account || account.password !== password) {
    showToast("Incorrect username or password.");
    return;
  }
  state.user = username;
  state.transactions = loadTransactions();
  sessionStorage.setItem("pennypilot-user", username);
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  setupProfile(account);
  render();
}

function signOut() {
  sessionStorage.removeItem("pennypilot-user");
  state.user = null;
  appView.classList.add("hidden");
  loginView.classList.remove("hidden");
  el("loginForm").reset();
}

function setupProfile(account) {
  el("profileName").textContent = account.name;
  el("profileRole").textContent = account.role;
  el("profileInitial").textContent = account.name.charAt(0);
  el("welcomeHeading").textContent = `${greeting()}, ${account.name}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function filteredByMonth() {
  return state.transactions.filter((transaction) => transaction.date.startsWith(state.month));
}

function visibleTransactions() {
  return filteredByMonth()
    .filter((transaction) => state.type === "all" || transaction.type === state.type)
    .filter((transaction) => {
      const query = state.search.toLowerCase();
      return transaction.description.toLowerCase().includes(query) || transaction.category.toLowerCase().includes(query);
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function render() {
  const monthly = filteredByMonth();
  const income = monthly.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = monthly.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const incomeCount = monthly.filter((item) => item.type === "income").length;
  const expenseCount = monthly.filter((item) => item.type === "expense").length;

  el("balanceValue").textContent = currency.format(income - expenses);
  el("incomeValue").textContent = currency.format(income);
  el("expenseValue").textContent = currency.format(expenses);
  el("incomeNote").textContent = `${incomeCount} income ${incomeCount === 1 ? "entry" : "entries"}`;
  el("expenseNote").textContent = `${expenseCount} expense ${expenseCount === 1 ? "entry" : "entries"}`;
  el("balanceNote").textContent = income - expenses >= 0 ? "You are in the green" : "Expenses exceed income";

  renderTransactions();
  renderCategories(monthly);
  renderPage();
  drawChart(monthly);
  drawCategoryPie(monthly);
}

function renderPage() {
  document.querySelectorAll("[data-page-view]").forEach((section) => {
    section.classList.toggle("hidden", section.dataset.pageView !== state.page);
  });
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === state.page);
  });
}

function setPage(page, shouldFocusSearch = false) {
  state.page = page;
  renderPage();
  if (page === "overview") {
    requestAnimationFrame(() => {
      drawChart(filteredByMonth());
      drawCategoryPie(filteredByMonth());
    });
  }
  if (page === "transactions" && shouldFocusSearch) {
    setTimeout(() => el("searchInput").focus(), 120);
  }
  el("sidebar").classList.remove("open");
}

function renderTransactions() {
  const transactions = visibleTransactions();
  el("transactionBody").innerHTML = transactions.map((transaction) => {
    const config = CATEGORY_CONFIG[transaction.category] || CATEGORY_CONFIG.Other;
    const sign = transaction.type === "income" ? "+" : "−";
    return `
      <tr>
        <td><div class="transaction-name"><span style="color:${config.color}">${config.symbol}</span>${escapeHtml(transaction.description)}</div></td>
        <td>${escapeHtml(transaction.category)}</td>
        <td>${formatDate(transaction.date)}</td>
        <td><span class="type-pill ${transaction.type}">${transaction.type}</span></td>
        <td class="amount-${transaction.type}">${sign}${currency.format(transaction.amount)}</td>
        <td><div class="row-actions"><button type="button" data-edit="${transaction.id}" aria-label="Edit transaction">✎</button><button type="button" class="delete-button" data-delete="${transaction.id}" aria-label="Delete transaction">×</button></div></td>
      </tr>`;
  }).join("");
  el("transactionEmpty").classList.toggle("hidden", transactions.length !== 0);
}

function renderCategories(monthly) {
  const totals = monthly.filter((item) => item.type === "expense").reduce((result, item) => {
    result[item.category] = (result[item.category] || 0) + Number(item.amount);
    return result;
  }, {});
  const categories = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = categories.reduce((sum, [, amount]) => sum + amount, 0);
  el("categoryList").innerHTML = categories.length ? categories.map(([name, amount]) => {
    const config = CATEGORY_CONFIG[name] || CATEGORY_CONFIG.Other;
    const percentage = total ? Math.round((amount / total) * 100) : 0;
    const activeClass = state.selectedCategory === name ? " active" : "";
    return `<button class="category-row${activeClass}" type="button" data-category="${escapeHtml(name)}" aria-label="Show ${escapeHtml(name)} amount">
      <div class="category-meta"><span class="category-name"><span class="category-symbol" style="color:${config.color}">${config.symbol}</span>${name}</span><strong>${currency.format(amount)}</strong></div>
      <div class="category-track"><div class="category-bar" style="width:${percentage}%;background:${config.color}"></div></div>
    </button>`;
  }).join("") : '<div class="category-empty">No spending recorded this month.</div>';
}

function updateCashFlowSelection(target = state.selectedCashFlow) {
  state.selectedCashFlow = target;
  el("cashFlowSelection").textContent = target
    ? `${target.label} ${target.type}: ${currency.format(target.value)}`
    : "Click any bar to view its amount.";
}

function updateCategorySelection(name = state.selectedCategory) {
  state.selectedCategory = name;
  const target = categoryTargets.find((item) => item.name === name);
  el("categorySelection").textContent = target
    ? `${target.name}: ${currency.format(target.amount)}`
    : "Click a slice or category to view its amount.";
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === name);
  });
}

function drawChart(monthly) {
  const canvas = el("cashFlowChart");
  const wrap = canvas.parentElement;
  const ratio = window.devicePixelRatio || 1;
  const width = wrap.clientWidth;
  const height = wrap.clientHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, width, height);
  cashFlowTargets = [];

  const days = new Date(Number(state.month.slice(0, 4)), Number(state.month.slice(5, 7)), 0).getDate();
  const groups = [{ from: 1, to: 7 }, { from: 8, to: 14 }, { from: 15, to: 21 }, { from: 22, to: days }];
  const data = groups.map((group) => monthly.filter((item) => {
    const day = Number(item.date.slice(8, 10));
    return day >= group.from && day <= group.to;
  }).reduce((acc, item) => {
    acc[item.type] += Number(item.amount);
    return acc;
  }, { income: 0, expense: 0 }));
  const max = Math.max(...data.flatMap((item) => [item.income, item.expense]), 0);
  el("chartEmpty").classList.toggle("hidden", max !== 0);
  if (!max) {
    updateCashFlowSelection(null);
    return;
  }

  const padding = { top: 10, right: 10, bottom: 30, left: 42 };
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = width - padding.left - padding.right;
  ctx.font = "10px DM Sans";
  ctx.textBaseline = "middle";
  const darkMode = document.body.classList.contains("dark-mode");
  ctx.strokeStyle = darkMode ? "#2a4050" : "#e9eef0";
  ctx.fillStyle = darkMode ? "#99aab6" : "#8b99a3";
  ctx.lineWidth = 1;
  for (let index = 0; index <= 4; index += 1) {
    const y = padding.top + (chartHeight / 4) * index;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    const label = max - (max / 4) * index;
    ctx.fillText(label >= 1000 ? `${Math.round(label / 1000)}k` : Math.round(label), 4, y);
  }

  const groupWidth = chartWidth / groups.length;
  const barWidth = Math.min(22, groupWidth / 4);
  data.forEach((item, index) => {
    const center = padding.left + groupWidth * index + groupWidth / 2;
    const label = `Week ${index + 1}`;
    drawBar(ctx, center - barWidth - 2, padding.top, barWidth, chartHeight, item.income, max, "#1aaa7a", { label, type: "income" });
    drawBar(ctx, center + 2, padding.top, barWidth, chartHeight, item.expense, max, "#ef6a6a", { label, type: "expenses" });
    ctx.fillStyle = darkMode ? "#99aab6" : "#8b99a3";
    ctx.textAlign = "center";
    ctx.fillText(label, center, height - 10);
  });
  const selectedTarget = state.selectedCashFlow
    ? cashFlowTargets.find((item) => item.key === state.selectedCashFlow.key)
    : null;
  updateCashFlowSelection(selectedTarget || null);
}

function drawCategoryPie(monthly) {
  const canvas = el("categoryPieChart");
  const wrap = canvas.parentElement;
  const ratio = window.devicePixelRatio || 1;
  const width = wrap.clientWidth;
  const height = wrap.clientHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, width, height);
  categoryTargets = [];

  const totals = monthly.filter((item) => item.type === "expense").reduce((result, item) => {
    result[item.category] = (result[item.category] || 0) + Number(item.amount);
    return result;
  }, {});
  const categories = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const total = categories.reduce((sum, [, amount]) => sum + amount, 0);
  el("pieTotalValue").textContent = currency.format(total);
  el("pieEmpty").classList.toggle("hidden", total !== 0);
  if (!total) {
    updateCategorySelection(null);
    return;
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * .44;
  let startAngle = -Math.PI / 2;
  categories.forEach(([name, amount]) => {
    const slice = (amount / total) * Math.PI * 2;
    const endAngle = startAngle + slice;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = (CATEGORY_CONFIG[name] || CATEGORY_CONFIG.Other).color;
    ctx.fill();
    categoryTargets.push({ name, amount, startAngle, endAngle, centerX, centerY, radius });
    startAngle = endAngle;
  });
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * .56, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode") ? "#162b3a" : "#ffffff";
  ctx.fill();
  updateCategorySelection(state.selectedCategory && categoryTargets.some((item) => item.name === state.selectedCategory) ? state.selectedCategory : null);
}

function drawBar(ctx, x, top, width, height, value, max, color, meta) {
  const barHeight = (value / max) * (height - 8);
  const y = top + height - barHeight;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, width, barHeight, 4);
  ctx.fill();
  if (value > 0) {
    cashFlowTargets.push({
      ...meta,
      key: `${meta.label}-${meta.type}`,
      value,
      x,
      y,
      width,
      height: barHeight,
    });
  }
}

function getCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function selectCashFlowBar(event) {
  const point = getCanvasPoint(event, event.currentTarget);
  const target = cashFlowTargets.find((item) =>
    point.x >= item.x &&
    point.x <= item.x + item.width &&
    point.y >= item.y &&
    point.y <= item.y + item.height
  );
  if (target) updateCashFlowSelection(target);
}

function selectCategorySlice(event) {
  const point = getCanvasPoint(event, event.currentTarget);
  const target = categoryTargets.find((item) => {
    const dx = point.x - item.centerX;
    const dy = point.y - item.centerY;
    const distance = Math.hypot(dx, dy);
    let angle = Math.atan2(dy, dx);
    if (angle < -Math.PI / 2) angle += Math.PI * 2;
    return distance <= item.radius && distance >= item.radius * .56 && angle >= item.startAngle && angle <= item.endAngle;
  });
  if (target) updateCategorySelection(target.name);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function updateCategoryOptions(type, selected = "") {
  el("category").innerHTML = Object.entries(CATEGORY_CONFIG)
    .filter(([, config]) => config.type === type || config.type === "both")
    .map(([name]) => `<option value="${name}" ${name === selected ? "selected" : ""}>${name}</option>`)
    .join("");
}

function openTransactionDialog(transaction = null) {
  el("transactionForm").reset();
  el("transactionId").value = transaction?.id || "";
  el("dialogTitle").textContent = transaction ? "Edit transaction" : "Add transaction";
  const type = transaction?.type || "expense";
  document.querySelector(`input[name="type"][value="${type}"]`).checked = true;
  updateCategoryOptions(type, transaction?.category);
  el("description").value = transaction?.description || "";
  el("amount").value = transaction?.amount || "";
  el("date").value = transaction?.date || `${state.month}-${String(new Date().getDate()).padStart(2, "0")}`;
  transactionDialog.showModal();
}

function saveTransaction(event) {
  event.preventDefault();
  const id = el("transactionId").value;
  const transaction = {
    id: id || makeId(),
    description: el("description").value.trim(),
    amount: Number(el("amount").value),
    category: el("category").value,
    date: el("date").value,
    type: document.querySelector('input[name="type"]:checked').value,
  };
  if (id) {
    state.transactions = state.transactions.map((item) => item.id === id ? transaction : item);
  } else {
    state.transactions.push(transaction);
  }
  saveTransactions();
  transactionDialog.close();
  render();
  showToast(id ? "Transaction updated." : "Transaction added.");
}

function deleteTransaction(id) {
  if (!window.confirm("Delete this transaction?")) return;
  state.transactions = state.transactions.filter((item) => item.id !== id);
  saveTransactions();
  render();
  showToast("Transaction deleted.");
}

function exportCsv() {
  const transactions = visibleTransactions();
  if (!transactions.length) {
    showToast("No transactions to export.");
    return;
  }
  const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [
    ["Description", "Category", "Date", "Type", "Amount"],
    ...transactions.map((item) => [item.description, item.category, item.date, item.type, item.amount]),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `pennypilot-${state.month}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("CSV export ready.");
}

function applyTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle("dark-mode", theme === "dark");
  el("themeButton").textContent = theme === "dark" ? "Light" : "Dark";
  localStorage.setItem("pennypilot-theme", theme);
  if (state.user) render();
}

el("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  signIn(el("username").value.trim().toLowerCase(), el("password").value);
});
el("logoutButton").addEventListener("click", signOut);
el("themeButton").addEventListener("click", () => applyTheme(state.theme === "dark" ? "light" : "dark"));
document.querySelectorAll("[data-export-transactions]").forEach((button) => button.addEventListener("click", exportCsv));
document.querySelectorAll("[data-add-transaction]").forEach((button) => button.addEventListener("click", () => openTransactionDialog()));
el("transactionForm").addEventListener("submit", saveTransaction);
el("closeDialogButton").addEventListener("click", () => transactionDialog.close());
el("cancelDialogButton").addEventListener("click", () => transactionDialog.close());
el("monthFilter").addEventListener("change", (event) => { state.month = event.target.value; render(); });
el("searchInput").addEventListener("input", (event) => { state.search = event.target.value; renderTransactions(); });
el("typeFilter").addEventListener("change", (event) => { state.type = event.target.value; renderTransactions(); });
document.querySelectorAll('input[name="type"]').forEach((input) => input.addEventListener("change", () => updateCategoryOptions(input.value)));
el("transactionBody").addEventListener("click", (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) openTransactionDialog(state.transactions.find((item) => item.id === editId));
  if (deleteId) deleteTransaction(deleteId);
});
document.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => {
  setPage(button.dataset.page, button.dataset.page === "transactions");
}));
el("cashFlowChart").addEventListener("click", selectCashFlowBar);
el("categoryPieChart").addEventListener("click", selectCategorySlice);
el("categoryList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (button) updateCategorySelection(button.dataset.category);
});
el("menuButton").addEventListener("click", () => el("sidebar").classList.toggle("open"));
window.addEventListener("resize", () => {
  if (!state.user) return;
  drawChart(filteredByMonth());
  drawCategoryPie(filteredByMonth());
});

el("todayText").textContent = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date());
el("monthFilter").value = state.month;
applyTheme(state.theme);
const activeUser = sessionStorage.getItem("pennypilot-user");
if (activeUser && USERS[activeUser]) signIn(activeUser, USERS[activeUser].password);
