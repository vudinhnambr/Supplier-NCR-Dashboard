async function loadData() {

  try {

    console.log("Loading data...");

    const response =
      await fetch('/api/ncr');

    console.log(
      "Response Status:",
      response.status
    );

    const text =
      await response.text();

    console.log(
      "Raw Response:",
      text
    );

    const data =
      JSON.parse(text);

    console.log(
      "Total Rows:",
      data.length
    );

    document.getElementById('totalNcr')
      .textContent = data.length;

    const suppliers =
      [...new Set(
        data.map(x => x.Supplier)
      )];

    document.getElementById('totalSupplier')
      .textContent = suppliers.length;

    const qty =
      data.reduce(
        (a, b) =>
          a + (Number(b.Quantity) || 0),
        0
      );

    document.getElementById('totalQty')
      .textContent = qty;

    const parts =
      [...new Set(
        data.map(x => x.Part)
      )];

    document.getElementById('totalPart')
      .textContent = parts.length;

    buildSupplierChart(data);

    buildYearChart(data);

    const tbody =
      document.querySelector(
        '#detailTable tbody'
      );

    tbody.innerHTML =
      data.slice(0, 100)
      .map(r => `
        <tr>
          <td>${r.Supplier || ''}</td>
          <td>${r.Part || ''}</td>
          <td>${r.Phenomenon || ''}</td>
          <td>${r.Quantity || ''}</td>
        </tr>
      `)
      .join('');

  } catch (err) {

    console.error(
      "LOAD DATA ERROR:",
      err
    );

  }

}

function buildSupplierChart(data) {

  const count = {};

  data.forEach(row => {

    const supplier =
      row.Supplier || 'Unknown';

    count[supplier] =
      (count[supplier] || 0) + 1;

  });

  const canvas =
    document.getElementById(
      'supplierChart'
    );

  if (!canvas) {
    console.error(
      "supplierChart not found"
    );
    return;
  }

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: Object.keys(count),
      datasets: [{
        label: 'NCR',
        data: Object.values(count)
      }]
    }
  });

}

function buildYearChart(data) {

  const count = {};

  data.forEach(row => {

    const year =
      row["NCR NCR Year"];

    count[year] =
      (count[year] || 0) + 1;

  });

  const canvas =
    document.getElementById(
      'yearChart'
    );

  if (!canvas) {
    console.error(
      "yearChart not found"
    );
    return;
  }

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: Object.keys(count),
      datasets: [{
        label: 'NCR',
        data: Object.values(count)
      }]
    }
  });

}

loadData();
