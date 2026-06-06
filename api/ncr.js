import axios from "axios";
import * as XLSX from "xlsx";

export default async function handler(req, res) {
  // 1. KIỂM TRA MẬT MÃ (Khớp với app.js)
  const authKey = req.headers["x-auth-key"];
  if (authKey !== "CSBearing") {
    return res.status(401).json({ error: "Mật mã không đúng hoặc không có quyền truy cập." });
  }

  // 2. KIỂM TRA BIẾN MÔI TRƯỜNG
  const sourceUrl = process.env.NCR_XLSX_URL;
  if (!sourceUrl) {
    return res.status(500).json({ error: "Chưa cấu hình NCR_XLSX_URL trên Vercel." });
  }

  try {
    // 3. CHUYỂN ĐỔI URL GOOGLE DRIVE SANG LINK TẢI TRỰC TIẾP
    const downloadUrl = toGoogleDriveDownloadUrl(sourceUrl);
    
    const response = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    // 4. ĐỌC DỮ LIỆU EXCEL
    const workbook = XLSX.read(response.data, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(422).json({ error: "File Excel không có dữ liệu (Sheet trống)." });
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });

    return res.status(200).json({
      sheetName,
      rowCount: rows.length,
      refreshedAt: new Date().toISOString(),
      rows
    });

  } catch (error) {
    console.error("Lỗi API:", error.message);
    // Trả về lỗi chi tiết để bạn dễ kiểm tra
    return res.status(500).json({ 
      error: `Lỗi tải file: ${error.message}. Hãy kiểm tra quyền 'Anyone with the link' trên Google Drive.` 
    });
  }
}

// Hàm tách ID và tạo Link download chuẩn của Google
function toGoogleDriveDownloadUrl(url) {
  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  const idMatch = url.match(/[?&]id=([^&]+)/);
  const id = fileMatch?.[1] || idMatch?.[1];

  if (!id) return url;
  return `https://drive.google.com/uc?export=download&id=${id}`;
}
