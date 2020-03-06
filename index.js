const express = require("express");
const path = require("path");
const ejs = require("ejs");
const app = express();
const cors = require("cors");
const multer = require("multer");
const puppeteer = require("puppeteer");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const PORT = process.env.PORT || 3223;

const adapter = new FileSync("db.json");
const db = low(adapter);

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Set some defaults (required if your JSON file is empty)
db.defaults({ uploads: [], count: 0 }).write();

app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json({ limit: "50mb" }));

app.use(cors());

app.set("view engine", "ejs");
app.set("views", __dirname + "/public/views");

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/generate", upload.single("image"), (req, res) => {
  return (async () => {
    // console.log(req.body);
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName)
      return res.status(404).send("First name or last name not found");
    if (!req.file) return res.status(404).send("File not found");
    const { buffer: fileBuffer } = req.file || {};
    const file = fileBuffer.toString("base64");
    let browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
      defaultViewport: {
        width: 1080,
        height: 1080
      }
    });
    let page = await browser.newPage();
    await page.goto(
      `file://${path.resolve(__dirname, "public", "badge.html")}`
    );
    await page.evaluate(
      ({ firstName, lastName, file }) => {
        const colors = [
          { bg: "#ff226e", fc: "#fff" },
          { bg: "#01a8cc", fc: "#fff" },
          { bg: "#ff4500", fc: "#fff" },
          { bg: "#c0ff02", fc: "#333" },
          { bg: "#f6dc2a", fc: "#333" }
        ];
        const i = Math.floor(Math.random() * 5);
        const { bg, fc } = colors[i];
        const _ = e => document.querySelector(e);
        _("#badge").style.backgroundColor = bg;
        _("#badge").style.color = fc;
        _("#badge-image").src = `data:image/jpeg;base64,${file}`;
        _("#badge-firstname").textContent = firstName;
        _("#badge-lastname").textContent = lastName;
        return;
      },
      { firstName, file, lastName }
    );

    const badge = await page.$("#badge");
    const bounding_box = await badge.boundingBox();
    // console.log(bounding_box);

    const baseImage = await badge.screenshot({
      omitBackground: true,
      encoding: "base64",
      type: "jpeg",
      quality: 100,
      clip: {
        x: bounding_box.x,
        y: bounding_box.y,
        width: Math.min(bounding_box.width, page.viewport().width),
        height: Math.min(bounding_box.height, page.viewport().height)
      }
    });
    await browser.close();
    res.send(baseImage);
    res.end();
  })();
});

app.listen(PORT, () => console.log(`Server listening: ${PORT}`));

// (async () => {
//   const filename = "Olowolabi-Adebolanle-1.jpg";
//   firstName = "hope";
//   lastName = "Praise";
//   let browser = await puppeteer.launch({
//     headless: true,
//     defaultViewport: {
//       width: 1080,
//       height: 1080
//     }
//   });
//   let page = await browser.newPage();
//   await page.goto(`file://${path.resolve(__dirname, "public", "badge.html")}`);
//   const height = await page.evaluate(
//     ({ firstName, lastName, filename }) => {
//       const randomColor = (() => {
//         const colors = ["#ff206e", "#fee12b", "#0019cc", "#bfff00", "#ff4500"];
//         const i = Math.floor(Math.random() * 6);
//         return colors[i];
//       })();
//       const _ = e => document.querySelector(e);
//       _("#badge").style.backgroundColor = randomColor;
//       _("#badge-image").style.backgroundImage = `url(uploads/${filename})`;
//       _("#badge-firstname").textContent = firstName;
//       _("#badge-lastname").textContent = lastName;
//       return document.body.scrollHeight;
//     },
//     { firstName, filename, lastName }
//   );

//   const badge = await page.$("#badge");
//   const bounding_box = await badge.boundingBox();

//   const baseImage = await badge.screenshot({
//     type: "jpeg",
//     omitBackground: true,
//     quality: 100,
//     encoding: "base64",
//     clip: {
//       x: bounding_box.x,
//       y: bounding_box.y,
//       width: Math.min(bounding_box.width, page.viewport().width),
//       height: Math.min(bounding_box.height, page.viewport().height)
//     }
//   });
//   await browser.close();
//   fs.writeFileSync(__dirname + "/temp/testy.jpeg", baseImage, "base64");
//   console.log("DONE");
// })();
