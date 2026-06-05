import axios from "axios";

export default async function handler(req, res) {

  try {

    const response =
      await axios.get(
        process.env.NCR_XLSX_URL
      );

    return res.status(200).json({
      first100:
        response.data.substring(0,100)
    });

  } catch(error) {

    return res.status(500).json({
      error:error.message
    });

  }

}
