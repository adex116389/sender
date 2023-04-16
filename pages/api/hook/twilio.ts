import type { NextApiRequest } from "next";
import nextConnect from "next-connect";
import { NextApiResponseServerIO } from "../../../types/next";
const handler = nextConnect();

handler.post(async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  console.log(`body: `, req.body);

  // return message
  res.status(201);
});

export default handler;
