import axios from "axios";

export default async function handler(req, res) {

  try {

    const fileUrl =
      process.env.NCR_XLSX_URL;

    const response =
      await axios.get(fileUrl);

    return res.status(200).json({
      status: "STEP2_OK",
      dataType: typeof response.data
    });

  } catch (error) {

    return res.status(500).json({
      error: error.message
    });

  }

}
