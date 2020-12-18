require("dotenv").config(); // STILL NEED TO SET UP ENV
const express = require("express");
const PORT = process.env.PORT;
const app = express();
// const multer = require("multer");
// const upload = multer({ dest: "uploads/" });
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const fileUrl = require("file-url");
// const playwright = require("playwright");
const cors = require("cors");
const Parse = require("parse/node");
// const chromium = require("chromium");
Parse.serverURL = "https://parseapi.back4app.com"; // This is your Server URL
Parse.initialize(
  "i1n5ocgqfKFxUW1pHIGl69o5Zi2rCXDPMOUzoLpI", // This is your Application ID
  "HpIjRypO3TtIxFJtnubmEzmvfgBSthdA1vuHth9M", // This is your Javascript key
  "eNhhRrWFCu6eASCvTHSReuSDdnvY7S09TH6s6KHD" // This is your Master key (never use it in the frontend)
);

//   // await page.type('#search', "' UNION (SELECT table_name, table_schema, table_type, reference_generation FROM information_schema.tables);--");
//   // await page.type('#search', "' UNION (SELECT username, username, email, password FROM users);--");
//
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

app.post("/", (req, res) => {
  console.log("injection request received.", req.body);

  const r = req.body;

  let bMilli = Date.now();

  puppetMaster(r.instructions, r.url, r.userID, r.anonInt);
  res.status(200).send(req.body);
});

const puppetMaster = async (instructions, url, userID, anonInt) => {
  console.log("puppet spawned", instructions, url, userID);

  // const PUPPETEER_OPTIONS = {
  //   headless: true,
  //   args: [
  //     "--disable-gpu",
  //     "--disable-dev-shm-usage",
  //     "--disable-setuid-sandbox",
  //     "--timeout=30000",
  //     "--no-first-run",
  //     "--no-zygote",
  //     "--single-process",
  //     "--proxy-server='direct://",
  //     "--proxy-bypass-list=*",
  //     "deterministic-fetch",
  //   ],
  // /app/node_modules/apify/node_modules/puppeteer/.local-chromium/linux-818858
  // const browser = await playwright["chromium"] // puppeteer instead?
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  console.log(browser);
  const page = await browser.newPage();
  console.log(page);
  console.log(url);
  await page.goto(url);

  let content = await page.content();
  console.log(content);

  for (let i = 0; instructions && i < instructions.length; i++) {
    console.log(i, instructions[i]);
    let ins = instructions[i];
    let elem = `#${ins.elementId}`;
    let input = `${ins.inputString}`;

    if (ins.type === "type") {
      console.log("type fired");
      await page.type(elem, input);
    } else if (ins.type === "click") {
      // await page.waitFor(2000);
      console.log("click fired");
      await page.waitForSelector(elem);
      await page.focus(elem);
      await page.click(elem);
      await page.keyboard.type("\n");

      // page.$eval(`#${ins.elementId}`, (elem) => elem.click());
    }
  }

  //   // await page.type('#search', "' UNION (SELECT table_name, table_schema, table_type, reference_generation FROM information_schema.tables);--");
  //   // await page.type('#search', "' UNION (SELECT username, username, email, password FROM users);--");

  let html = await page.content();
  console.log(html);

  let rand = Math.random().toFixed(1) * 10;
  let png = await page.screenshot({ path: `screenshot${rand}.png` });

  fs.readdir(".", { withFileTypes: true }, (err, files) => {
    console.log("\nCurrent directory files:");
    if (err) console.log(err);
    else {
      files.forEach((file) => {
        console.log(file);
      });
    }
  });

  let filepath = await fileUrl(`./screenshot${rand}.png`);
  console.log(filepath);
  let params = {
    puppet: {
      html,
      // png: await fetch(`${filepath}`),
    },
    userID,
    instructions,
    url,
    anonInt: anonInt || 000,
  };

  Parse.Cloud.run("save", params)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => console.log(error));

  browser.close();
};
app.listen(PORT, () => {
  console.log("Listening on", PORT);
});
