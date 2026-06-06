import axios from "axios";
import * as XLSX from "xlsx";

export default async function handler(req, res) {
  // KIỂM TRA MẬT MÃ TỪ HEADER
  const authKey = req.headers["x-auth-key"];
  if (authKey !== "CSBearing") {
    return res.status(401).json({ error: "Unauthorized. Vui lòng nhập mật mã đúng." });
  }

  const sourceUrl = process.env.NCR_XLSX_URL;
  if (!sourceUrl) {
    return res.status(500).json({ error: "NCR_XLSX_URL chưa được cấu hình." });
  }

  try {
    const fileId = urlToId(sourceUrl);
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    const response = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      timeout: 30000
    });

    const workbook = XLSX.read(response.data, { type: "buffer", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

    return res.status(200).json({
      sheetName: workbook.SheetNames[0],
      rowCount: rows.length,
      refreshedAt: new Date().toISOString(),
      rows
    });
  } catch (error) {
    return res.status(500).json({ error: "Lỗi tải file từ Google Drive." });
  }
}

function urlToId(url) {
  const m = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  return m ? m[1] : url;
}
