import axios from "axios";

export default async function handler(req, res) {

  const fileUrl =
    process.env.NCR_XLSX_URL;

  const response =
    await axios.get(fileUrl);

  res.status(200).json({
    status: "STEP2_OK",
    size: response.data.length
  });

}
