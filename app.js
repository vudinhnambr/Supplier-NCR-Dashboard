let rawData = [];
let supplierChart;
let yearChart;
let monthChart;
let statusChart;
let partChart;
let phenomenonChart;

let selectedSupplier = "";
let selectedYear = "";
let selectedMonth = "";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const chartColor = "#2589ff";
const chartBorder = "#6fb7ff";

const columnAliases = {
  supplier: ["Supplier", "Vendor", "Nhà cung cấp", "Nha cung cap"],
  year: ["NCR NCR Year", "NCR Year", "Year", "Năm", "Nam"],
  month: ["NCR Month", "Month", "Tháng", "Thang"],
  quantity: ["Quantity", "Qty", "Số lượng", "So luong"],
  part: ["Part", "Part Name", "Item", "Material", "Mã hàng", "Ma hang"],
  phenomenon: ["Phenomenon", "Defect", "Issue", "Lỗi", "Loi", "Hiện tượng", "Hien tuong"],
  replacement: ["Replacement Status", "Status", "Disposition"],
  closeDate: ["NCR Close date", "NCR Close Date", "Close Date", "Closed Date"],
  status: ["NCR Status", "Status", "Close Status"]
};

let columns = {};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("supplierFilter").addEventListener("change", event => {
    selectedSupplier = event.target.value;
    renderDashboard();
  });

  document.getElementById("yearFilter").addEventListener("change", event => {
    selectedYear = event.target.value;
    renderDashboard();
  });

  document.getElementById("resetButton").addEventListener("click", resetFilters);

  loadData();
});

async function loadData() {
  setStatus("Loading Google Drive Excel data...");

  try {
    const response = await fetch("/api/ncr");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || `API returned ${response.status}`);
    }

    rawData = Array.isArray(payload.rows) ? payload.rows : [];
    columns = detectColumns(rawData);

    populateFilters();
    renderDashboard();

    setStatus(`${payload.rowCount.toLocaleString("en-US")} rows | ${payload.sheetName} | ${formatRefreshTime(payload.refreshedAt)}`);
  } catch (error) {
    console.error(error);
    setStatus(error.message);
    rawData = [];
    renderDashboard();
  }
}

function detectColumns(rows) {
  const headers = Object.keys(rows[0] || {});

  return Object.fromEntries(
    Object.entries(columnAliases).map(([key, aliases]) => {
      const found = headers.find(header =>
        aliases.some(alias => normalizeText(header) === normalizeText(alias))
      ) || headers.find(header =>
        aliases.some(alias => normalizeText(header).includes(normalizeText(alias)))
      );

      return [key, found || ""];
    })
  );
}

function populateFilters() {
  fillSelect(
    document.getElementById("supplierFilter"),
    "All Suppliers",
    distinct(rawData.map(row => normalizeSupplier(valueOf(row, columns.supplier))).filter(Boolean))
  );

  fillSelect(
    document.getElementById("yearFilter"),
    "All Years",
    distinct(rawData.map(row => toYear(valueOf(row, columns.year))).filter(Boolean)).sort((a, b) => Number(a) - Number(b))
  );
}

function fillSelect(select, allLabel, values) {
  select.innerHTML = `<option value="">${escapeHtml(allLabel)}</option>`;

  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function resetFilters() {
  selectedSupplier = "";
  selectedYear = "";
  selectedMonth = "";
  document.getElementById("supplierFilter").value = "";
  document.getElementById("yearFilter").value = "";
  renderDashboard();
}

function getFilteredData() {
  return rawData.filter(row => {
    const supplier = normalizeSupplier(valueOf(row, columns.supplier));
    const year = toYear(valueOf(row, columns.year));
    const month = toMonth(valueOf(row, columns.month));

    return (!selectedSupplier || supplier === selectedSupplier)
      && (!selectedYear || year === selectedYear)
      && (!selectedMonth || month === selectedMonth);
  });
}

function renderDashboard() {
  const data = getFilteredData();

  updateKPI(data);
  buildCharts(data);
}

function updateKPI(data) {
  setText("totalNcr", data.length.toLocaleString("en-US"));
  setText("totalQty", sumQuantity(data).toLocaleString("en-US"));
  setText("totalSupplier", distinct(data.map(row => normalizeSupplier(valueOf(row, columns.supplier))).filter(Boolean)).length);
  setText("totalPart", distinct(data.map(row => valueOf(row, columns.part)).filter(Boolean)).length);
  setText("openNcr", countOpenNcr(data).toLocaleString("en-US"));
}

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

  const entries = groupCount(data, columns.supplier, value => normalizeSupplier(value))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  supplierChart = createBarChart("supplierChart", entries, "Supplier NCR", false, elements => {
    if (!elements.length) return;
    selectedSupplier = entries[elements[0].index].label;
    document.getElementById("supplierFilter").value = selectedSupplier;
    renderDashboard();
  });
}

function buildYearChart(data) {    yearChart?.destroy();    const entries = groupCount(     data,     columns.year,     toYear   ).sort(     (a, b) =>       Number(a.label) -       Number(b.label)   );    yearChart = createBarChart(     "yearChart",     entries,     "NCR by Year",     false,     elements => {        if (!elements.length)         return;        const year =         entries[           elements[0].index         ].label;        selectedYear =         selectedYear === year           ? ""           : year;        document.getElementById(         "yearFilter"       ).value =         selectedYear;        renderDashboard();      }   );  }   yearChart?.destroy();    const entries = groupCount(data, columns.year, toYear)     .sort((a, b) => Number(a.label) - Number(b.label));    yearChart = createBarChart(     "yearChart",     entries,     "NCR by Year",     false,     elements => {        if (!elements.length) return;        const year =         entries[elements[0].index].label;        selectedYear =         selectedYear === year           ? ""           : year;        document.getElementById(         "yearFilter"       ).value =         selectedYear;        renderDashboard();     }   ); }   yearChart?.destroy();    const entries = groupCount(data, columns.year, toYear)     .sort((a, b) => Number(a.label) - Number(b.label));    yearChart = createBarChart(     "yearChart",     entries,     "NCR by Year",     false,     elements => {        if (!elements.length) return;        const year =         entries[elements[0].index].label;        selectedYear =         selectedYear === year           ? ""           : year;        document.getElementById(         "yearFilter"       ).value =         selectedYear;        renderDashboard();     }   ); }
  yearChart?.destroy();

  const entries = groupCount(data, columns.year, toYear)
    .sort((a, b) => Number(a.label) - Number(b.label));

  yearChart = createBarChart("yearChart", entries, "NCR by Year");
}

function buildMonthChart(data) {
  monthChart?.destroy();

  const counts = Object.fromEntries(MONTHS.map(month => [month, 0]));
  data.forEach(row => {
    const month = toMonth(valueOf(row, columns.month));
    if (month in counts) counts[month] += 1;
  });

  const entries = MONTHS.map(month => ({ label: month, value: counts[month] }));

  monthChart = createBarChart("monthChart", entries, "NCR by Month", false, elements => {
    if (!elements.length) return;
    selectedMonth = MONTHS[elements[0].index];
    renderDashboard();
  });
}

function buildStatusChart(data) {
  statusChart?.destroy();

  const entries = groupCount(data, columns.replacement)
    .sort((a, b) => b.value - a.value);

  statusChart = createBarChart("statusChart", entries, "Replacement Status");
}

function buildPartChart(data) {
  partChart?.destroy();

  const entries = groupCount(data, columns.part)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  partChart = createBarChart("partChart", entries, "Top Parts", true);
}

function buildPhenomenonChart(data) {
  phenomenonChart?.destroy();

  const entries = groupCount(data, columns.phenomenon)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  phenomenonChart = createBarChart("phenomenonChart", entries, "Phenomenon", true);
}

function createBarChart(canvasId, entries, title, horizontal = false, onSelect = null) {
  const labels = entries.map(entry => entry.label);
  const values = entries.map(entry => entry.value);

  return new Chart(document.getElementById(canvasId), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: title,
        data: values,
        backgroundColor: chartColor,
        borderColor: chartBorder,
        borderWidth: 1,
        borderRadius: 2,
        maxBarThickness: 48
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: horizontal ? "y" : "x",
      onClick: (_event, elements) => onSelect?.(elements),
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: item => `Total NCR: ${item.raw}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: horizontal,
          ticks: { color: "#d7e5ff", autoSkip: false, maxRotation: horizontal ? 0 : 45 },
          grid: { color: "rgba(255,255,255,.05)" }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#d7e5ff", precision: 0 },
          grid: { color: "rgba(255,255,255,.08)" }
        }
      }
    },
    plugins: [valueLabelPlugin]
  });
}

const valueLabelPlugin = {
  id: "valueLabel",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const horizontal = chart.options.indexAxis === "y";

    ctx.save();
    ctx.fillStyle = "#d7e5ff";
    ctx.font = "12px Segoe UI, Arial, sans-serif";
    ctx.textAlign = horizontal ? "left" : "center";
    ctx.textBaseline = "middle";

    meta.data.forEach((bar, index) => {
      const value = chart.data.datasets[0].data[index];
      if (!value) return;

      if (horizontal) {
        ctx.fillText(value, bar.x + 6, bar.y);
      } else {
        ctx.fillText(value, bar.x, bar.y - 10);
      }
    });

    ctx.restore();
  }
};

function groupCount(data, column, transform = value => value) {
  if (!column) return [];

  const counts = new Map();

  data.forEach(row => {
    const label = transform(valueOf(row, column)) || "Unknown";
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  return [...counts.entries()].map(([label, value]) => ({
    label: String(label),
    value
  }));
}

function countOpenNcr(data) {
  return data.filter(row => {
    const explicitStatus = normalizeText(valueOf(row, columns.status));
    const closeDate = String(valueOf(row, columns.closeDate) || "").trim();

    if (explicitStatus) {
      return !["close", "closed", "complete", "completed", "done"].includes(explicitStatus);
    }

    return closeDate === "";
  }).length;
}

function sumQuantity(data) {
  return data.reduce((total, row) => total + toNumber(valueOf(row, columns.quantity)), 0);
}

function valueOf(row, column) {
  return column ? row[column] : "";
}

function toYear(value) {
  const text = String(value || "").trim();
  const match = text.match(/\b(19\d{2}|20\d{2})\b/);
  return match ? match[1] : "";
}

function toMonth(value) {
  const text = String(value || "").trim();
  const number = Number(text);

  if (number >= 1 && number <= 12) {
    return MONTHS[number - 1];
  }

  const normalized = normalizeText(text);
  return MONTHS.find(month => normalized.startsWith(month.toLowerCase())) || "";
}

function toNumber(value) {
  const number = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function normalizeSupplier(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function distinct(values) {
  return [...new Set(values.map(value => String(value).trim()).filter(Boolean))];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function setStatus(message) {
  document.getElementById("dataStatus").textContent = message;
}

function formatRefreshTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-US", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
