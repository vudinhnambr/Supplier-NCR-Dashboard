let rawData = [];

let supplierChart;
let yearChart;
let monthChart;
let statusChart;
let partChart;
let phenomenonChart;

async function loadData() {

    try {

        const response =
            await fetch('/api/ncr');

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

    return (v || "")
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

    const supplierList =
        [
            ...new Set(
                rawData.map(
                    x => normalizeSupplier(
                        x.Supplier
                    )
                )
            )
        ].sort();

    supplierList.forEach(s => {

        const option =
            document.createElement("option");

        option.value = s;
        option.textContent = s;

        supplierFilter.appendChild(option);

    });

    const years =
        [
            ...new Set(
                rawData.map(
                    x => x["NCR NCR Year"]
                )
            )
        ].sort();

    years.forEach(y => {

        const option =
            document.createElement("option");

        option.value = y;
        option.textContent = y;

        yearFilter.appendChild(option);

    });

    supplierFilter.onchange =
        renderDashboard;

    yearFilter.onchange =
        renderDashboard;

}

function renderDashboard() {

    const supplier =
        document.getElementById(
            "supplierFilter"
        ).value;

    const year =
        document.getElementById(
            "yearFilter"
        ).value;

    let data =
        rawData;

    if (supplier) {

        data =
            data.filter(
                x =>
                    normalizeSupplier(
                        x.Supplier
                    ) === supplier
            );

    }

    if (year) {

        data =
            data.filter(
                x =>
                    String(
                        x["NCR NCR Year"]
                    ) === year
            );

    }

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
            (a, b) =>
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

function countBy(data, key) {

    const obj = {};

    data.forEach(row => {

        const value =
            row[key] ||
            "Unknown";

        obj[value] =
            (obj[value] || 0)
            + 1;

    });

    return obj;

}

function drawChart(
    chartRef,
    canvasId,
    title,
    countObj
) {

    if (chartRef)
        chartRef.destroy();

    return new Chart(
        document.getElementById(
            canvasId
        ),
        {
            type: "bar",

            data: {

                labels:
                    Object.keys(
                        countObj
                    ),

                datasets: [
                    {
                        label:
                            title,

                        data:
                            Object.values(
                                countObj
                            ),

                        backgroundColor:
                            "#228be6"
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio:
                    false,

                plugins: {

                    legend: {
                        display: false
                    }

                },

                scales: {

                    y: {
                        beginAtZero: true
                    }

                }

            }

        }
    );

}

function buildCharts(data) {

    supplierChart =
        drawChart(
            supplierChart,
            "supplierChart",
            "Supplier NCR",
            countBy(
                data,
                "Supplier"
            )
        );

    yearChart =
        drawChart(
            yearChart,
            "yearChart",
            "NCR by Year",
            countBy(
                data,
                "NCR NCR Year"
            )
        );

    monthChart =
        drawChart(
            monthChart,
            "monthChart",
            "NCR by Month",
            countBy(
                data,
                "NCR Month"
            )
        );

    statusChart =
        drawChart(
            statusChart,
            "statusChart",
            "Replacement Status",
            countBy(
                data,
                "Replacement Status"
            )
        );

    const topParts =
        Object.entries(
            countBy(
                data,
                "Part"
            )
        )
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 10);

    partChart =
        drawChart(
            partChart,
            "partChart",
            "Top 10 Parts",
            Object.fromEntries(
                topParts
            )
        );

    phenomenonChart =
        drawChart(
            phenomenonChart,
            "phenomenonChart",
            "Phenomenon",
            countBy(
                data,
                "Phenomenon"
            )
        );

}

loadData();