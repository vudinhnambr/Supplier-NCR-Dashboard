export default function handler(req, res) {
  return res.status(200).json({
    status: "OK",
    message: "API is working"
  });
}
