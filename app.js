let rawData = [];

let supplierChart;
let yearChart;
let monthChart;
let statusChart;
let partChart;
let phenomenonChart;

let selectedSupplier = null;
let selectedYear = null;
let selectedMonth = null;

const chartColor = "#3b9cff";
const chartBorder = "#66b3ff";

async function loadData() {

    try {

        const response =
            await fetch("/api/ncr");

        const data =
            await response.json();

        rawData = data;

        populateFilters();

        renderDashboard();

    } catch (err) {

        console.error(err);

        alert("Cannot load NCR data");

    }

}

function normalizeSupplier(v) {

    return String(v || "")
        .trim()
        .toUpperCase();

}

function populateFilters() {

    const supplierFilter =
        document.getElementById(
            "supplierFilter"
        );

    const yearFilter =
        document.getElementById(
            "yearFilter"
        );

    const suppliers =
        [...new Set(
            rawData.map(
                x => normalizeSupplier(
                    x.Supplier
                )
            )
        )].sort();

    suppliers.forEach(s => {

        const option =
            document.createElement("option");

        option.value = s;
        option.textContent = s;

        supplierFilter.appendChild(
            option
        );

    });

    const years =
        [...new Set(
            rawData.map(
                x =>
                    x["NCR NCR Year"]
            )
        )].sort();

    years.forEach(y => {

        const option =
            document.createElement("option");

        option.value = y;
        option.textContent = y;

        yearFilter.appendChild(
            option
        );

    });

    supplierFilter.onchange =
        () => {

            selectedSupplier =
                supplierFilter.value;

            renderDashboard();

        };

    yearFilter.onchange =
        () => {

            selectedYear =
                yearFilter.value;

            renderDashboard();

        };

}

function getFilteredData() {

    let data = [...rawData];

    if (selectedSupplier) {

        data =
            data.filter(
                x =>
                    normalizeSupplier(
                        x.Supplier
                    ) === selectedSupplier
            );

    }

    if (selectedYear) {

        data =
            data.filter(
                x =>
                    String(
                        x["NCR NCR Year"]
                    ) === String(
                        selectedYear
                    )
            );

    }

    if (selectedMonth) {

        data =
            data.filter(
                x =>
                    x["NCR Month"]
                    === selectedMonth
            );

    }

    return data;

}

function renderDashboard() {

    const data =
        getFilteredData();

    updateKPI(data);

    buildCharts(data);

}

function updateKPI(data) {

    document.getElementById(
        "totalNcr"
    ).textContent =
        data.length;

    document.getElementById(
        "totalQty"
    ).textContent =
        data.reduce(
            (a,b)=>
                a +
                (
                    Number(
                        b.Quantity
                    ) || 0
                ),
            0
        );

    document.getElementById(
        "totalSupplier"
    ).textContent =
        new Set(
            data.map(
                x =>
                    normalizeSupplier(
                        x.Supplier
                    )
            )
        ).size;

    document.getElementById(
        "totalPart"
    ).textContent =
        new Set(
            data.map(
                x => x.Part
            )
        ).size;

    document.getElementById(
        "openNcr"
    ).textContent =
        data.filter(
            x =>
                String(
                    x["NCR Close date"]
                )
                .toUpperCase()
                !== "CLOSE"
        ).length;

}

function countBy(data,key){

    const obj = {};

    data.forEach(row=>{

        const value =
            row[key] ||
            "Unknown";

        obj[value] =
            (obj[value] || 0)
            + 1;

    });

    return obj;

}

function destroyChart(chart){

    if(chart)
        chart.destroy();

}

function createBarChart(
    canvasId,
    labels,
    values,
    title,
    horizontal=false,
    clickCallback=null
){

    return new Chart(

        document.getElementById(
            canvasId
        ),

        {

            type:"bar",

            data:{

                labels,

                datasets:[{

                    label:title,

                    data:values,

                    backgroundColor:
                        chartColor,

                    borderColor:
                        chartBorder,

                    borderWidth:1

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                indexAxis:
                    horizontal
                    ? "y"
                    : "x",

                plugins:{

                    legend:{
                        display:false
                    }

                },

                onClick:
                    clickCallback,

                scales:{

                    y:{
                        beginAtZero:true,
                        ticks:{
                            color:"#d7e5ff"
                        },
                        grid:{
                            color:
                            "rgba(255,255,255,.08)"
                        }
                    },

                    x:{
                        ticks:{
                            color:"#d7e5ff"
                        },
                        grid:{
                            color:
                            "rgba(255,255,255,.05)"
                        }
                    }

                }

            }

        }

    );

}

function buildCharts(data){

    buildSupplierChart(data);

    buildYearChart(data);

    buildMonthChart(data);

    buildStatusChart(data);

    buildPartChart(data);

    buildPhenomenonChart(data);

}

function buildSupplierChart(data){

    destroyChart(
        supplierChart
    );

    const obj =
        countBy(
            data,
            "Supplier"
        );

    const sorted =
        Object.entries(obj)
        .sort(
            (a,b)=>
                b[1]-a[1]
        );

    supplierChart =
        createBarChart(
            "supplierChart",
            sorted.map(x=>x[0]),
            sorted.map(x=>x[1]),
            "Supplier NCR",
            false,
            (evt,elements)=>{

                if(!elements.length)
                    return;

                selectedSupplier =
                    sorted[
                        elements[0].index
                    ][0];

                document
                    .getElementById(
                        "supplierFilter"
                    )
                    .value =
                        normalizeSupplier(
                            selectedSupplier
                        );

                renderDashboard();

            }
        );

}

function buildYearChart(data){

    destroyChart(yearChart);

    const obj =
        countBy(
            data,
            "NCR NCR Year"
        );

    const years =
        Object.keys(obj)
        .sort(
            (a,b)=>a-b
        );

    yearChart =
        createBarChart(
            "yearChart",
            years,
            years.map(
                y=>obj[y]
            ),
            "NCR by Year"
        );

}

function buildMonthChart(data){

    destroyChart(monthChart);

    const months = [

        "Jan","Feb","Mar",
        "Apr","May","Jun",
        "Jul","Aug","Sep",
        "Oct","Nov","Dec"

    ];

    const count = {};

    months.forEach(
        m=>count[m]=0
    );

    data.forEach(row=>{

        const month =
            row["NCR Month"];

        if(
            count[month]
            !== undefined
        ){

            count[month]++;

        }

    });

    monthChart =
        createBarChart(
            "monthChart",
            months,
            months.map(
                m=>count[m]
            ),
            "NCR by Month",
            false,
            (evt,elements)=>{

                if(!elements.length)
                    return;

                selectedMonth =
                    months[
                        elements[0].index
                    ];

                renderDashboard();

            }
        );

}

function buildStatusChart(data){

    destroyChart(statusChart);

    const obj =
        countBy(
            data,
            "Replacement Status"
        );

    statusChart =
        createBarChart(
            "statusChart",
            Object.keys(obj),
            Object.values(obj),
            "Replacement Status"
        );

}

function buildPartChart(data){

    destroyChart(partChart);

    const topParts =
        Object.entries(
            countBy(
                data,
                "Part"
            )
        )
        .sort(
            (a,b)=>
                b[1]-a[1]
        )
        .slice(0,10);

    partChart =
        createBarChart(
            "partChart",
            topParts.map(
                x=>x[0]
            ),
            topParts.map(
                x=>x[1]
            ),
            "Top Parts",
            true
        );

}

function buildPhenomenonChart(data){

    destroyChart(
        phenomenonChart
    );

    const obj =
        countBy(
            data,
            "Phenomenon"
        );

    const sorted =
        Object.entries(obj)
        .sort(
            (a,b)=>
                b[1]-a[1]
        );

    phenomenonChart =
        createBarChart(
            "phenomenonChart",
            sorted.map(
                x=>x[0]
            ),
            sorted.map(
                x=>x[1]
            ),
            "Phenomenon",
            true
        );

}

loadData();