const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const dns = require("dns");
const shortid = require("shortid");
require("dotenv").config();
const mongoose = require("mongoose");

connect_to_db();

const Schema = mongoose.Schema;
const exercise_info_schema = new Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true },
});
const user_schema = new Schema({
  username: { type: String, required: true },
});
const log_schema = new Schema({
  username: { type: String, required: true },
  count: { type: Number, required: true },
  log: {
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, required: true },
  },
});

const ExerciseInfo = mongoose.model("exercise_info", exercise_info_schema);
const User = mongoose.model("user", user_schema);
const Log = mongoose.model("user", log_schema);

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

function connect_to_db() {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});