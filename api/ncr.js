import axios from "axios";
import * as XLSX from "xlsx";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sourceUrl = process.env.NCR_XLSX_URL;

  if (!sourceUrl) {
    return res.status(500).json({
      error: "NCR_XLSX_URL is not configured in Vercel environment variables."
    });
  }

  try {
    const downloadUrl = toGoogleDriveDownloadUrl(sourceUrl);
    const response = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: 25 * 1024 * 1024,
      headers: {
        "User-Agent": "supplier-ncr-dashboard/1.0"
      }
    });

    const workbook = XLSX.read(response.data, {
      type: "buffer",
      cellDates: true
    });

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return res.status(422).json({ error: "Workbook has no worksheets." });
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false
    });

    return res.status(200).json({
      source: "google-drive-excel",
      sheetName,
      rowCount: rows.length,
      refreshedAt: new Date().toISOString(),
      rows
    });
  } catch (error) {
    console.error("NCR API error:", error.message);
    return res.status(500).json({
      error: "Cannot load NCR Excel file. Check NCR_XLSX_URL and Google Drive sharing."
    });
  }
}

function toGoogleDriveDownloadUrl(url) {
  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  const idMatch = url.match(/[?&]id=([^&]+)/);
  const id = fileMatch?.[1] || idMatch?.[1];

  if (!id) {
    return url;
  }

  return `https://drive.google.com/uc?export=download&id=${id}`;
}
