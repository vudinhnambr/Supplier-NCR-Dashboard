import axios from "axios";
import * as XLSX from "xlsx";

export default async function handler(req, res) {

  try {

    const fileUrl = process.env.NCR_XLSX_URL;

    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer"
    });

    const workbook = XLSX.read(
      response.data,
      {
        type: "buffer"
      }
    );

    const worksheet =
      workbook.Sheets["Sheet1"];

    const rows =
      XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: ""
        }
      );

    return res.status(200).json({
      totalRows: rows.length,
      firstRow: rows[0]
    });

  } catch (error) {

    return res.status(500).json({
      error: error.message
    });

  }

}
