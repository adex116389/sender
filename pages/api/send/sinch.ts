import type { NextApiRequest } from "next";
import nextConnect from "next-connect";
import _ from "lodash";
import fs from "fs";
import { data } from "../../../data";
import middleware from "../../../middleware/middleware";
import { NextApiResponseServerIO } from "../../../types/next";
import { delay } from "../../../utility/delay";
import { numbersToArray } from "../../../utility/numbersToArray";

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
  const apiToken = values.token;
  const serviceId = values.spId;
  const senderId = values.senderId;
  const fromNumbers = values.fromNumbers.split(`,`);

  if (!serviceId) {
    res.status(500).send(`Please provide your account service plan ID`);
    return;
  }

  if (!apiToken) {
    res.status(500).send(`Please provide your account API Token`);
    return;
  }

  if (!fromNumbers) {
    res.status(500).send(`Please provide from numbers`);
    return;
  }

  res?.socket?.server?.io?.emit("loading", {
    status: true,
  });

  res?.socket?.server?.io?.emit("allSent", false);

  for (const to of _.chunk(numbers, 1000)) {
    if (data.stopSending) break;

    const resp = await fetch(
      "https://us.sms.api.sinch.com/xms/v1/" + serviceId + "/batches",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiToken,
        },
        body: JSON.stringify({
          from:
            senderId ||
            fromNumbers[Math.floor(Math.random() * fromNumbers.length)],
          to,
          body: message,
          delivery_report: "per_recipient",
        }),
      }
    );

    const r = await resp.json();
    console.log(r);

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
