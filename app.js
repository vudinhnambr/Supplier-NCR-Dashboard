
async function loadData(){
 const res=await fetch('/api/ncr');
 const data=await res.json();

 document.getElementById('totalNcr').textContent=data.length;

 const suppliers=[...new Set(data.map(x=>x.Supplier))];
 document.getElementById('totalSupplier').textContent=suppliers.length;

 const qty=data.reduce((a,b)=>a+(Number(b.Quantity)||1),0);
 document.getElementById('totalQty').textContent=qty;

 const parts=[...new Set(data.map(x=>x.Part))];
 document.getElementById('totalPart').textContent=parts.length;

 const tbody=document.querySelector('#detailTable tbody');
 tbody.innerHTML=data.slice(0,50).map(r=>`
 <tr>
 <td>${r.Supplier||''}</td>
 <td>${r.Part||''}</td>
 <td>${r.Phenomenon||''}</td>
 <td>${r.Quantity||1}</td>
 </tr>`).join('');
}
loadData();
