const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

connect_to_db();

const Schema = mongoose.Schema;
const exercise_info_schema = new Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
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
const Log = mongoose.model("log", log_schema);

var current_user = {};

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

function connect_to_db() {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  var { username } = req.body;
  var user_model = new User({
    username
  });
  user_model.save(function(err, data) {
    if(err) res.json(err);
    else res.json(data);
  });
});

app.get("/api/users", (req, res) => {
  User.find({}, function(err, data) {
    current_user = data;
    res.json(data);
  });
});

app.post("/api/users/:_id/exercises", function(req, res) {
  User.findById(req.params._id, function(err, user) {
    var exercise_model = new ExerciseInfo({
      username: user.username,
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.data ? new Date(req.body.date) : new Date()
    });
    exercise_model.save(function(err, exercise) {
      var u = { _id: user._id, username: user.username, description: exercise.description, duration: exercise.duration, date: new Date(exercise.date).toDateString() }
      res.json(u);
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});