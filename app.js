let rawData = [];
let supplierChart, yearChart, monthChart, statusChart, partChart, phenomenonChart;

let selectedSupplier = "", selectedYear = "", selectedMonth = "";
let selectedPart = "", selectedPhenomenon = "", selectedStatus = "";

const ACTIVE_SUPPLIERS = ["WUXI PAIKE", "SINHOM", "TAESANG"];
const MASTER_PASSWORD = "CSBearing";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const chartColor = "#2589ff";
const chartBorder = "#6fb7ff";

const columnAliases = {
  supplier: ["Supplier", "Vendor", "Nhà cung cấp"],
  year: ["NCR NCR Year", "NCR Year", "Year"],
  month: ["NCR Month", "Month"],
  quantity: ["Quantity", "Qty"],
  part: ["Part", "Part Name", "Item"],
  phenomenon: ["Phenomenon", "Defect", "Lỗi"],
  replacement: ["Replacement Status", "Status"],
  closeDate: ["NCR Close date", "Close Date"],
  status: ["NCR Status", "Status"]
};

let columns = {};

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  if (sessionStorage.getItem("isLoggedIn") === "true") showDashboard();
  
  loginBtn.addEventListener("click", checkLogin);
  document.getElementById("passInput").addEventListener("keydown", (e) => { 
    if (e.key === "Enter") checkLogin(); 
  });

  document.getElementById("supplierFilter").addEventListener("change", e => { 
    selectedSupplier = e.target.value; renderDashboard(); 
  });
  
  document.getElementById("yearFilter").addEventListener("change", e => { 
    selectedYear = e.target.value; renderDashboard(); 
  });

  document.getElementById("resetButton").addEventListener("click", resetFilters);
});

function checkLogin() {
  const input = document.getElementById("passInput").value;
  if (input === MASTER_PASSWORD) {
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("authKey", input);
    showDashboard();
  } else {
    document.getElementById("loginError").style.display = "block";
  }
}

function showDashboard() {
  document.getElementById("loginGate").style.display = "none";
  document.getElementById("mainDashboard").style.display = "flex";
  loadData();
}

async function loadData() {
  setStatus("Đang tải dữ liệu...");
  try {
    const response = await fetch("/api/ncr", { 
      headers: { "x-auth-key": sessionStorage.getItem("authKey") } 
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Lỗi tải dữ liệu");

    rawData = payload.rows || [];
    columns = detectColumns(rawData);
    populateFilters();
    renderDashboard();
    setStatus(`${payload.rowCount.toLocaleString()} dòng | ${payload.sheetName}`);
  } catch (error) {
    setStatus(error.message);
  }
}

// LOGIC TÍNH TOÁN OPEN NCR MỚI
function countOpenNcr(data) {
  return data.filter(row => {
    const statusText = normalizeText(valueOf(row, columns.status));
    const closeDate = String(valueOf(row, columns.closeDate) || "").trim();

    // CHỈ TÍNH LÀ OPEN KHI CÓ CHỮ "OPEN"
    if (statusText.includes("open")) {
      return true;
    }

    // NẾU CÓ CHỮ "CLOSE" HOẶC CÓ NGÀY ĐÓNG THÌ LÀ CLOSED (KHÔNG PHẢI OPEN)
    if (statusText.includes("close") || closeDate !== "") {
      return false;
    }

    return false; // Mặc định các trường hợp khác là không Open
  }).length;
}

function getFilteredData() {
  return rawData.filter(row => {
    const s = normalizeSupplier(valueOf(row, columns.supplier));
    const y = toYear(valueOf(row, columns.year));
    const m = toMonth(valueOf(row, columns.month));
    const p = String(valueOf(row, columns.part) || "");
    const ph = String(valueOf(row, columns.phenomenon) || "");
    const st = String(valueOf(row, columns.replacement) || "");

    let matchS = !selectedSupplier ? true : (selectedSupplier === "active_suppliers" ? ACTIVE_SUPPLIERS.includes(s) : s === selectedSupplier);
    let matchY = !selectedYear || y === selectedYear;
    let matchM = !selectedMonth || m === selectedMonth;
    let matchPart = !selectedPart || p === selectedPart;
    let matchPhen = !selectedPhenomenon || ph === selectedPhenomenon;
    let matchStat = !selectedStatus || st === selectedStatus;

    return matchS && matchY && matchM && matchPart && matchPhen && matchStat;
  });
}

function renderDashboard() {
  const data = getFilteredData();
  updateKPI(data);
  buildCharts(data);
}

function resetFilters() {
  selectedSupplier = ""; selectedYear = ""; selectedMonth = "";
  selectedPart = ""; selectedPhenomenon = ""; selectedStatus = "";
  document.getElementById("supplierFilter").value = "";
  document.getElementById("yearFilter").value = "";
  renderDashboard();
}

function updateKPI(data) {
  setText("totalNcr", data.length.toLocaleString());
  setText("totalQty", data.reduce((t, r) => t + toNumber(valueOf(r, columns.quantity)), 0).toLocaleString());
  setText("totalSupplier", distinct(data.map(r => normalizeSupplier(valueOf(r, columns.supplier))).filter(Boolean)).length);
  setText("totalPart", distinct(data.map(r => valueOf(r, columns.part)).filter(Boolean)).length);
  setText("openNcr", countOpenNcr(data).toLocaleString()); // Gọi hàm tính Open mới
}

// --- BIỂU ĐỒ ---
function buildCharts(data) {
  buildSupplierChart(data);
  buildYearChart(data);
  buildMonthChart(data);
  buildStatusChart(data);
  buildPartChart(data);
  buildPhenomenonChart(data);
}

function buildSupplierChart(data) {
  supplierChart?.destroy();
  const entries = groupCount(data, columns.supplier, v => normalizeSupplier(v)).sort((a,b)=>b.value-a.value).slice(0,12);
  supplierChart = createBarChart("supplierChart", entries, "Supplier NCR", false, els => {
    if(!els.length) return;
    selectedSupplier = entries[els[0].index].label;
    document.getElementById("supplierFilter").value = selectedSupplier;
    renderDashboard();
  });
}

function buildYearChart(data) {
  yearChart?.destroy();
  const entries = groupCount(data, columns.year, toYear).sort((a,b)=>a.label-b.label);
  yearChart = createBarChart("yearChart", entries, "NCR by Year", false, els => {
    if(!els.length) return;
    selectedYear = entries[els[0].index].label;
    document.getElementById("yearFilter").value = selectedYear;
    renderDashboard();
  });
}

function buildMonthChart(data) {
  monthChart?.destroy();
  const counts = Object.fromEntries(MONTHS.map(m => [m, 0]));
  data.forEach(r => { const m = toMonth(valueOf(r, columns.month)); if(m in counts) counts[m]++; });
  const entries = MONTHS.map(m => ({ label: m, value: counts[m] }));
  monthChart = createBarChart("monthChart", entries, "NCR by Month", false, els => {
    if(!els.length) return;
    const val = MONTHS[els[0].index];
    selectedMonth = (selectedMonth === val) ? "" : val;
    renderDashboard();
  });
}

function buildPartChart(data) {
  partChart?.destroy();
  const entries = groupCount(data, columns.part).sort((a,b)=>b.value-a.value).slice(0,10);
  partChart = createBarChart("partChart", entries, "Top Parts", true, els => {
    if(!els.length) return;
    const val = entries[els[0].index].label;
    selectedPart = (selectedPart === val) ? "" : val;
    renderDashboard();
  });
}

function buildPhenomenonChart(data) {
  phenomenonChart?.destroy();
  const entries = groupCount(data, columns.phenomenon).sort((a,b)=>b.value-a.value).slice(0,10);
  phenomenonChart = createBarChart("phenomenonChart", entries, "Phenomenon", true, els => {
    if(!els.length) return;
    const val = entries[els[0].index].label;
    selectedPhenomenon = (selectedPhenomenon === val) ? "" : val;
    renderDashboard();
  });
}

function buildStatusChart(data) {
  statusChart?.destroy();
  const entries = groupCount(data, columns.replacement).sort((a,b)=>b.value-a.value);
  statusChart = createBarChart("statusChart", entries, "Status", false, els => {
    if(!els.length) return;
    const val = entries[els[0].index].label;
    selectedStatus = (selectedStatus === val) ? "" : val;
    renderDashboard();
  });
}

function createBarChart(id, entries, title, horizontal = false, onSelect = null) {
  return new Chart(document.getElementById(id), {
    type: "bar",
    data: {
      labels: entries.map(e => e.label),
      datasets: [{ label: title, data: entries.map(e => e.value), backgroundColor: chartColor, borderColor: chartBorder, borderWidth: 1, borderRadius: 2, maxBarThickness: 48 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: horizontal ? "y" : "x",
      onClick: (e, els) => onSelect?.(els),
      plugins: { legend: { display: false } },
      scales: { 
          x: { ticks: { color: "#d7e5ff" }, grid: { color: "rgba(255,255,255,.05)" } },
          y: { ticks: { color: "#d7e5ff" }, grid: { color: "rgba(255,255,255,.08)" } } 
      }
    },
    plugins: [valueLabelPlugin]
  });
}

const valueLabelPlugin = {
  id: "valueLabel",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.getDatasetMeta(0).data.forEach((bar, i) => {
      const v = chart.data.datasets[0].data[i];
      if (v === undefined) return;
      ctx.save(); ctx.fillStyle = "#d7e5ff"; ctx.font = "12px Arial";
      ctx.textAlign = chart.options.indexAxis === 'y' ? 'left' : 'center';
      ctx.fillText(v, chart.options.indexAxis === 'y' ? bar.x + 5 : bar.x, chart.options.indexAxis === 'y' ? bar.y : bar.y - 10);
      ctx.restore();
    });
  }
};

function detectColumns(rows) {
  const headers = Object.keys(rows[0] || {});
  return Object.fromEntries(Object.entries(columnAliases).map(([key, aliases]) => {
      const found = headers.find(h => aliases.some(a => normalizeText(h) === normalizeText(a))) || 
                    headers.find(h => aliases.some(a => normalizeText(h).includes(normalizeText(a))));
      return [key, found || ""];
  }));
}

function populateFilters() {
  const supplierSelect = document.getElementById("supplierFilter");
  const allSuppliers = distinct(rawData.map(row => normalizeSupplier(valueOf(row, columns.supplier))).filter(Boolean)).sort();
  supplierSelect.innerHTML = `<option value="">All Suppliers</option>`;
  const activeOpt = document.createElement("option");
  activeOpt.value = "active_suppliers";
  activeOpt.textContent = "⭐ Active Suppliers (Top 3)";
  activeOpt.style.color = "#4ea1ff"; activeOpt.style.fontWeight = "bold";
  supplierSelect.appendChild(activeOpt);
  allSuppliers.forEach(v => {
    const o = document.createElement("option"); o.value = v; o.textContent = v; supplierSelect.appendChild(o);
  });
  fillSelect(document.getElementById("yearFilter"), "All Years", distinct(rawData.map(row => toYear(valueOf(row, columns.year))).filter(Boolean)).sort((a,b)=>a-b));
}

function fillSelect(select, allLabel, values) {
  select.innerHTML = `<option value="">${allLabel}</option>`;
  values.forEach(v => { const o = document.createElement("option"); o.value = v; o.textContent = v; select.appendChild(o); });
}

function groupCount(data, col, trans = v => v) {
  if(!col) return [];
  const counts = new Map();
  data.forEach(r => { const l = trans(valueOf(r, col)) || "Unknown"; counts.set(l, (counts.get(l) || 0) + 1); });
  return [...counts.entries()].map(([label, value]) => ({ label: String(label), value }));
}

function valueOf(row, col) { return col ? row[col] : ""; }
function toYear(v) { const m = String(v||"").match(/\b(20\d{2})\b/); return m ? m[1] : ""; }
function toMonth(v) { 
    const n = Number(v); if(n >= 1 && n <= 12) return MONTHS[n-1];
    return MONTHS.find(m => normalizeText(v).startsWith(m.toLowerCase())) || "";
}
function toNumber(v) { const n = Number(String(v||"").replace(/,/g, "")); return isFinite(n) ? n : 0; }
function normalizeSupplier(v) { return String(v||"").trim().toUpperCase(); }
function normalizeText(v) { return String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); }
function distinct(vals) { return [...new Set(vals.map(v => String(v).trim()).filter(Boolean))]; }
function setText(id, v) { document.getElementById(id).textContent = v; }
function setStatus(m) { document.getElementById("dataStatus").textContent = m; }
function formatRefreshTime(v) { return v ? new Date(v).toLocaleString() : ""; }
