import type { NextApiRequest } from "next";
import nextConnect from "next-connect";
import fs from "fs";
import { data } from "../../../data";
import middleware from "../../../middleware/middleware";
import { NextApiResponseServerIO } from "../../../types/next";
import { delay } from "../../../utility/delay";
import { numbersToArray } from "../../../utility/numbersToArray";
import { Vonage } from "@vonage/server-sdk";
import { rand } from "../../../utility/rand";

interface ExtendedRequest extends NextApiRequest {
  files: any;
}

const handler = nextConnect();
handler.use(middleware);

handler.post(async (req: ExtendedRequest, res: NextApiResponseServerIO) => {
  const file = req.files.file;
  const values = JSON.parse(req.body.data);
  let numbers = numbersToArray(
    file ? fs.readFileSync(file[0].path).toString() : values.numbers
  ).map((number) => `+${number}`);

  const message = values.message;
  const apiKey = values.apiKey;
  const apiSecret = values.apiSecret;
  const senderId = values.senderId;
  const fromNumbers = values.fromNumbers;

  const vonage = new Vonage(
    // @ts-ignore
    {
      apiKey,
      apiSecret,
    }
  );

  res?.socket?.server?.io?.emit("loading", {
    status: true,
  });

  res?.socket?.server?.io?.emit("allSent", false);

  for (const number of numbers) {
    if (data.stopSending) break;

    try {
      await vonage.sms.send({
        to: number,
        from: senderId || rand(fromNumbers as string[]),
        text: message,
      });
    } catch (error) {
      console.error(`error:`, error);
    }

    await delay(110);
  }

  res?.socket?.server?.io?.emit("loading", {
    status: false,
  });

  res?.socket?.server?.io?.emit("allSent", true);

  setTimeout(() => {
    res?.socket?.server?.io?.emit("loading", {
      status: null,
    });
  }, 5000);

  data.stopSending = false;
  res.send(`Okay`);
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
