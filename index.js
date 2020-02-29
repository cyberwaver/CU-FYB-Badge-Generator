const express = require("express");
const path = require("path");
const ejs = require("ejs");
const app = express();
const cors = require("cors");
const multer = require("multer");
const shortId = require("shortid");
const moment = require("moment");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const scheduler = require("node-schedule");
const fs = require("fs");
const EventEmitter = require("events");
const PORT = process.env.PORT || 3223;

const adapter = new FileSync("db.json");
const db = low(adapter);

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, __dirname + "/public/uploads");
  },
  filename: function(req, { fieldname, originalname }, cb) {
    cb(null, fieldname + "-" + Date.now() + path.extname(originalname));
  }
});

const upload = multer({ storage: storage });

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

app.post("/", upload.single("image"), (req, res) => {
  const { filename } = req.file || {};
  const { firstName, lastName } = req.body;
  if (!firstName || !lastName)
    return res.json({
      status: "error",
      message: "FirstName or lastName empty"
    });
  if (!filename) return res.json({ status: "error", message: "File empty" });
  const id = shortId.generate();
  db.get("uploads")
    .push({
      id,
      firstName,
      lastName,
      fileName: filename,
      timestamp: Date.now()
    })
    .write();
  db.update("count", n => n + 1).write();

  return res.json({ status: "success", message: id });
});

app.get("/:id", (req, res) => {
  const { id } = req.params;
  const data = db
    .get("uploads")
    .find({ id })
    .value();
  if (!data) return res.redirect("/");
  const randomColor = () => {
    const colors = ["#ff206e", "#fee12b", "#0019cc", "#bfff00", "#ff4500"];
    const i = Math.floor(Math.random() * 6);
    return colors[i];
  };
  res.render("badge", { randomColor, ...data });
});

app.listen(PORT, () => console.log(`Server listening: ${PORT}`));

///////////////////////////////////////////////////
const imageRemover = () => {
  const { uploads } = db.getState();
  const list = uploads.map(({ id, timestamp, fileName }) => {
    return (
      moment(moment(Date.now())).diff(timestamp, "minutes") > 30 && {
        id,
        fileName
      }
    );
  });
  list.forEach(({ id, fileName }) => {
    db.get("uploads")
      .remove({ id })
      .write();
    fs.unlinkSync(__dirname + `/public/uploads/${fileName}`);
  });
  return;
};

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on("checkfiles", () => {
  imageRemover();
});

var j = scheduler.scheduleJob("*/30 * * * *", function() {
  console.log("Running Scheduler");
  myEmitter.emit("checkfiles");
});
