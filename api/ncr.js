import axios from "axios";
import * as XLSX from "xlsx";

export default async function handler(req, res) {

try {

```
const fileUrl = process.env.NCR_XLSX_URL;

if (!fileUrl) {
  return res.status(500).json({
    error: "NCR_XLSX_URL is missing"
  });
}

const response = await axios.get(fileUrl, {
  responseType: "arraybuffer"
});

const workbook = XLSX.read(
  response.data,
  { type: "buffer" }
);

const sheetName =
  workbook.SheetNames[0];

const worksheet =
  workbook.Sheets[sheetName];

const rows =
  XLSX.utils.sheet_to_json(
    worksheet,
    {
      defval: ""
    }
  );

return res.status(200).json(rows);
```

} catch (error) {

```
console.error("NCR API ERROR:", error);

return res.status(500).json({
  error: error.message,
  stack: error.stack
});
```

}

}
