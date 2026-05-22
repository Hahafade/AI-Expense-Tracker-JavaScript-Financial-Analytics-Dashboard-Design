const categoryRules = [
  {
    category: "Food",
    color: "#146c94",
    keywords: ["uber eats", "doordash", "starbucks", "restaurant", "coffee", "mcdonald", "tim hortons", "grocery", "groceries", "walmart groceries"]
  },
  {
    category: "Housing",
    color: "#7a5cba",
    keywords: ["rent", "mortgage", "hydro", "utilities", "internet", "tenant", "condo"]
  },
  {
    category: "Transportation",
    color: "#2f8f6b",
    keywords: ["gas", "uber", "lyft", "ttc", "presto", "transit", "parking", "shell", "petro"]
  },
  {
    category: "Entertainment",
    color: "#d47c3c",
    keywords: ["netflix", "spotify", "cinema", "movie", "concert", "game", "disney", "youtube"]
  },
  {
    category: "Shopping",
    color: "#c75d7a",
    keywords: ["amazon", "costco", "clothes", "supplies", "best buy", "ikea", "shopping"]
  },
  {
    category: "Health",
    color: "#4c86a8",
    keywords: ["pharmacy", "doctor", "clinic", "dentist", "gym", "medicine"]
  }
];

const historicalMonths = [
  { month: "March", amount: 1735 },
  { month: "April", amount: 1880 }
];

const sampleText = `Uber Eats - $23
Starbucks - $8
Rent - $1200
Netflix - $15
Gas - $80
Walmart groceries - $94
TTC monthly pass - $156
Amazon office supplies - $42
Pharmacy - $31
Restaurant dinner - $68`;

const elements = {
  input: document.querySelector("#expenseInput"),
  month: document.querySelector("#monthSelect"),
  budget: document.querySelector("#budgetInput"),
  analyze: document.querySelector("#analyzeButton"),
  loadSample: document.querySelector("#loadSampleButton"),
  export: document.querySelector("#exportButton"),
  ruleList: document.querySelector("#ruleList"),
  totalSpend: document.querySelector("#totalSpend"),
  budgetStatus: document.querySelector("#budgetStatus"),
  largestCategory: document.querySelector("#largestCategory"),
  largestShare: document.querySelector("#largestShare"),
  averageTransaction: document.querySelector("#averageTransaction"),
  transactionCount: document.querySelector("#transactionCount"),
  categoryChart: document.querySelector("#categoryChart"),
  trendChart: document.querySelector("#trendChart"),
  categoryLegend: document.querySelector("#categoryLegend"),
  insightList: document.querySelector("#insightList"),
  transactionTable: document.querySelector("#transactionTable")
};

let currentTransactions = [];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function parseTransactions(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const amountMatch = line.match(/-?\s*\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
      const amount = amountMatch ? Number(amountMatch[1]) : 0;
      const merchant = line
        .replace(amountMatch ? amountMatch[0] : "", "")
        .replace(/[-:|]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const classification = categorizeExpense(merchant);

      return {
        merchant: merchant || "Unlabeled expense",
        amount,
        category: classification.category,
        confidence: classification.confidence
      };
    })
    .filter((transaction) => transaction.amount > 0);
}

function categorizeExpense(merchant) {
  const normalized = merchant.toLowerCase();
  for (const rule of categoryRules) {
    const matched = rule.keywords.some((keyword) => normalized.includes(keyword));
    if (matched) {
      return { category: rule.category, confidence: "High" };
    }
  }

  return { category: "Other", confidence: "Low" };
}

function summarizeByCategory(transactions) {
  return transactions.reduce((summary, transaction) => {
    summary[transaction.category] = (summary[transaction.category] || 0) + transaction.amount;
    return summary;
  }, {});
}

function getCategoryColor(category) {
  const match = categoryRules.find((rule) => rule.category === category);
  return match ? match.color : "#7d8798";
}

function updateMetrics(transactions) {
  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const budget = Number(elements.budget.value) || 0;
  const average = transactions.length ? total / transactions.length : 0;
  const categorySummary = summarizeByCategory(transactions);
  const sortedCategories = Object.entries(categorySummary).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0] || ["None", 0];
  const budgetDifference = budget - total;

  elements.totalSpend.textContent = formatCurrency(total);
  elements.budgetStatus.textContent = budgetDifference >= 0
    ? `${formatCurrency(budgetDifference)} under budget`
    : `${formatCurrency(Math.abs(budgetDifference))} over budget`;
  elements.budgetStatus.style.color = budgetDifference >= 0 ? "var(--success)" : "var(--danger)";
  elements.largestCategory.textContent = topCategory[0];
  elements.largestShare.textContent = total ? `${formatPercent((topCategory[1] / total) * 100)} of spending` : "0% of spending";
  elements.averageTransaction.textContent = formatCurrency(average);
  elements.transactionCount.textContent = `${transactions.length} transactions`;
}

function drawCategoryChart(transactions) {
  const canvas = elements.categoryChart;
  const context = canvas.getContext("2d");
  const categorySummary = summarizeByCategory(transactions);
  const entries = Object.entries(categorySummary).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, entry) => sum + entry[1], 0);

  context.clearRect(0, 0, canvas.width, canvas.height);
  elements.categoryLegend.innerHTML = "";

  if (!total) {
    drawEmptyState(context, canvas, "No expenses to chart");
    return;
  }

  const centerX = 170;
  const centerY = 170;
  const radius = 118;
  let startAngle = -Math.PI / 2;

  entries.forEach(([category, amount]) => {
    const slice = (amount / total) * Math.PI * 2;
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, radius, startAngle, startAngle + slice);
    context.closePath();
    context.fillStyle = getCategoryColor(category);
    context.fill();
    startAngle += slice;
  });

  context.beginPath();
  context.arc(centerX, centerY, 64, 0, Math.PI * 2);
  context.fillStyle = "#ffffff";
  context.fill();
  context.fillStyle = "#172033";
  context.font = "700 20px Inter, sans-serif";
  context.textAlign = "center";
  context.fillText(formatCurrency(total), centerX, centerY + 6);
  context.fillStyle = "#68758c";
  context.font = "600 13px Inter, sans-serif";
  context.fillText("total spend", centerX, centerY + 28);

  entries.forEach(([category, amount]) => {
    const legendItem = document.createElement("span");
    legendItem.className = "legend-item";
    legendItem.innerHTML = `<span class="legend-swatch" style="background:${getCategoryColor(category)}"></span>${category} ${formatPercent((amount / total) * 100)}`;
    elements.categoryLegend.appendChild(legendItem);
  });
}

function drawTrendChart(transactions) {
  const canvas = elements.trendChart;
  const context = canvas.getContext("2d");
  const currentTotal = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const currentMonth = elements.month.options[elements.month.selectedIndex].text.split(" ")[0];
  const data = [...historicalMonths, { month: currentMonth, amount: currentTotal }];
  const maxAmount = Math.max(...data.map((point) => point.amount), 1) * 1.18;
  const chartLeft = 64;
  const chartBottom = 286;
  const chartHeight = 210;
  const barWidth = 70;
  const gap = 82;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#d9e1ee";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(chartLeft, 38);
  context.lineTo(chartLeft, chartBottom);
  context.lineTo(470, chartBottom);
  context.stroke();

  data.forEach((point, index) => {
    const x = chartLeft + 44 + index * gap;
    const barHeight = Math.max((point.amount / maxAmount) * chartHeight, 2);
    const y = chartBottom - barHeight;
    const isCurrent = index === data.length - 1;

    context.fillStyle = isCurrent ? "#146c94" : "#b9c7d8";
    context.fillRect(x, y, barWidth, barHeight);
    context.fillStyle = "#172033";
    context.font = "700 13px Inter, sans-serif";
    context.textAlign = "center";
    context.fillText(formatCurrency(point.amount), x + barWidth / 2, y - 10);
    context.fillStyle = "#68758c";
    context.font = "600 13px Inter, sans-serif";
    context.fillText(point.month, x + barWidth / 2, chartBottom + 28);
  });
}

function drawEmptyState(context, canvas, message) {
  context.fillStyle = "#68758c";
  context.font = "700 16px Inter, sans-serif";
  context.textAlign = "center";
  context.fillText(message, canvas.width / 2, canvas.height / 2);
}

function buildInsights(transactions) {
  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const budget = Number(elements.budget.value) || 0;
  const categorySummary = summarizeByCategory(transactions);
  const sortedCategories = Object.entries(categorySummary).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0] || ["None", 0];
  const foodSpend = categorySummary.Food || 0;
  const transportationSpend = categorySummary.Transportation || 0;
  const monthAverage = historicalMonths.reduce((sum, month) => sum + month.amount, 0) / historicalMonths.length;
  const trendChange = monthAverage ? ((total - monthAverage) / monthAverage) * 100 : 0;
  const insights = [];

  if (!transactions.length) {
    return [{ tone: "", text: "Add expenses to generate spending insights and recommendations." }];
  }

  insights.push({
    tone: "",
    text: `${topCategory[0]} is your largest expense category at ${formatPercent((topCategory[1] / total) * 100)} of total spending.`
  });

  if (foodSpend / total > 0.22) {
    insights.push({
      tone: "warning",
      text: `Food spending represents ${formatPercent((foodSpend / total) * 100)} of expenses. Consider setting a weekly delivery or coffee budget to improve savings.`
    });
  }

  if (transportationSpend > 0) {
    insights.push({
      tone: "",
      text: `Transportation spend is ${formatCurrency(transportationSpend)} this month. Track recurring transit, fuel, and ride-share costs separately for stronger reporting.`
    });
  }

  if (budget && total > budget) {
    insights.push({
      tone: "risk",
      text: `You are ${formatCurrency(total - budget)} over budget. Review non-essential categories before the next billing cycle.`
    });
  } else if (budget) {
    insights.push({
      tone: "",
      text: `You are currently within budget with ${formatCurrency(budget - total)} remaining. Maintaining this pace supports a healthier monthly savings rate.`
    });
  }

  insights.push({
    tone: Math.abs(trendChange) > 15 ? "warning" : "",
    text: `Current monthly spending is ${formatPercent(Math.abs(trendChange))} ${trendChange >= 0 ? "higher" : "lower"} than the prior two-month average.`
  });

  return insights;
}

function renderInsights(transactions) {
  const insights = buildInsights(transactions);
  elements.insightList.innerHTML = insights
    .map((insight) => `<div class="insight ${insight.tone}">${insight.text}</div>`)
    .join("");
}

function renderTable(transactions) {
  elements.transactionTable.innerHTML = transactions
    .map((transaction) => `
      <tr>
        <td>${escapeHtml(transaction.merchant)}</td>
        <td><span class="category-badge">${transaction.category}</span></td>
        <td class="amount">${formatCurrency(transaction.amount)}</td>
        <td>${transaction.confidence}</td>
      </tr>
    `)
    .join("");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function analyzeExpenses() {
  currentTransactions = parseTransactions(elements.input.value);
  updateMetrics(currentTransactions);
  drawCategoryChart(currentTransactions);
  drawTrendChart(currentTransactions);
  renderInsights(currentTransactions);
  renderTable(currentTransactions);
  localStorage.setItem("ai-expense-tracker-input", elements.input.value);
}

function renderRules() {
  elements.ruleList.innerHTML = categoryRules
    .map((rule) => `<span class="rule-pill">${rule.category}: ${rule.keywords.slice(0, 3).join(", ")}</span>`)
    .join("");
}

function exportCsv() {
  if (!currentTransactions.length) {
    analyzeExpenses();
  }

  const headers = ["Merchant", "Category", "Amount", "Confidence"];
  const rows = currentTransactions.map((transaction) => [
    transaction.merchant,
    transaction.category,
    transaction.amount.toFixed(2),
    transaction.confidence
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "categorized-expenses.csv";
  link.click();
  URL.revokeObjectURL(url);
}

elements.analyze.addEventListener("click", analyzeExpenses);
elements.export.addEventListener("click", exportCsv);
elements.loadSample.addEventListener("click", () => {
  elements.input.value = sampleText;
  analyzeExpenses();
});
elements.budget.addEventListener("change", analyzeExpenses);
elements.month.addEventListener("change", analyzeExpenses);

const savedInput = localStorage.getItem("ai-expense-tracker-input");
if (savedInput) {
  elements.input.value = savedInput;
}

renderRules();
analyzeExpenses();
