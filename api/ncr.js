import axios from "axios";
import * as XLSX from "xlsx";

export default async function handler(req, res) {
  const authKey = req.headers["x-auth-key"];
  if (authKey !== "CSBearing") {
    return res.status(401).json({ error: "Mật mã không đúng." });
  }

  // Lấy link và xóa bỏ mọi khoảng trắng thừa ở hai đầu
  let sourceUrl = process.env.NCR_XLSX_URL ? process.env.NCR_XLSX_URL.trim() : null;
  
  if (!sourceUrl) {
    return res.status(500).json({ error: "Thiếu biến NCR_XLSX_URL trên Vercel." });
  }

  try {
    const fileId = extractId(sourceUrl);
    if (!fileId) {
      return res.status(400).json({ error: "Link Google Drive không đúng định dạng." });
    }

    // Sử dụng link download trực tiếp chuẩn nhất
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    console.log("Đang tải từ ID:", fileId); // Log để kiểm tra trong Vercel Logs

    const response = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    const workbook = XLSX.read(response.data, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });

    return res.status(200).json({
      sheetName,
      rowCount: rows.length,
      refreshedAt: new Date().toISOString(),
      rows
    });
  } catch (error) {
    // Nếu lỗi 404, giải thích rõ hơn cho người dùng
    const status = error.response ? error.response.status : "Unknown";
    const msg = (status === 404) 
      ? "Lỗi 404: Google không tìm thấy file. Hãy kiểm tra lại link trong Vercel (xem có thừa ký tự nào không)."
      : error.message;

    return res.status(500).json({ error: `Không thể đọc file: ${msg}` });
  }
}

function extractId(url) {
  // Regex này mạnh hơn để bắt đúng ID giữa các dấu gạch chéo
  const match = url.match(/\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
}
