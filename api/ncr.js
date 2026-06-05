import axios from "axios";

export default async function handler(req, res) {

  try {

    const fileUrl =
      process.env.NCR_XLSX_URL;

    return res.status(200).json({
      status: "STEP1_OK",
      fileUrl
    });

  } catch (error) {

    return res.status(500).json({
      error: error.message
    });

  }

}
