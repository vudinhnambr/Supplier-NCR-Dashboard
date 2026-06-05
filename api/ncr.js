import axios from "axios";
import * as XLSX from "xlsx";

export default async function handler(req, res) {

  try {

    const response = await axios.get(
      process.env.NCR_XLSX_URL,
      {
        responseType: "arraybuffer"
      }
    );

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

    return res.status(200).json(rows);

  } catch (error) {

    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });

  }

}
