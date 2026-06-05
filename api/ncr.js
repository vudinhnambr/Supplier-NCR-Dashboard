import axios from "axios";
import XLSX from "xlsx";

export default async function handler(req, res) {
try {

```
const fileUrl =
  process.env.NCR_XLSX_URL;

const response =
  await axios.get(fileUrl, {
    responseType: "arraybuffer"
  });

const workbook =
  XLSX.read(response.data, {
    type: "buffer"
  });

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

res.status(200).json(rows);
```

} catch (error) {

```
console.error(error);

res.status(500).json({
  error: error.message
});
```

}
}
