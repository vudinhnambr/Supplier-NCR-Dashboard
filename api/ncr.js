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

    return res.status(200).json({
      status: "STEP3_OK",
      sheets: workbook.SheetNames
    });

  } catch (error) {

    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });

  }

}
