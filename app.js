let rawData = [];
let supplierChart, yearChart, monthChart, statusChart, partChart, phenomenonChart;

// Các biến trạng thái lọc
let selectedSupplier = "";
let selectedYear = "";
let selectedMonth = "";
let selectedPart = "";
let selectedPhenomenon = "";
let selectedStatus = "";

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
    selectedSupplier = e.target.value; 
    renderDashb
