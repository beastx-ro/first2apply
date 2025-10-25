import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }

  // Redirect to the deep link
  res.writeHead(302, { Location: url });
  res.end();
}
