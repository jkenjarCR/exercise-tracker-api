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
  date: { type: Date, required: false, default: Date.now },
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
    username,
  });
  user_model.save(function (err, data) {
    if (err) res.json(err);
    else res.json(data);
  });
});

app.get("/api/users", (req, res) => {
  User.find({}, function (err, data) {
    current_user = data;
    res.json(data);
  });
});

app.post("/api/users/:_id/exercises", function (req, res) {
  User.findById(req.params._id, function (err, user) {
    var { date } = req.body;

    if (!date) {
      date = new Date(Date.now()).toDateString();
    } else {
      const parts = date.split("-");
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);

      const utcDate = new Date(Date.UTC(year, month, day));
      date = new Date(
        utcDate.getTime() + utcDate.getTimezoneOffset() * 60000
      ).toDateString();
    }

    var exercise_model = new ExerciseInfo({
      username: user.username,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: date,
      _id: user._id,
    });

    exercise_model.save(function (err, exercise) {
      if (!err) {
        var u = {
          _id: user._id,
          username: user.username,
          description: exercise.description,
          duration: Number(exercise.duration),
          date: exercise.date.toDateString(),
        };
        res.json(u);
      } else {
        res.json({ error: "Exercise failed to save." });
      }
    });
  });
});

app.get("/api/users/:_id/logs", function (req, res) {
  User.findById(req.params._id,  async function (err, user) {
    if (!err && user._id) {
      var { from, to, limit } = req.query;
      limit = limit ? limit : 0;
      var date_obj = {};
      if (from) date_obj["$gte"] = new Date(from);
      if (to) date_obj["$lte"] = new Date(to);
      let filter = { username: user.username };
      if (from || to) {
        filter.date = date_obj;
      }
      var exercises = await ExerciseInfo.find(filter).limit(limit);

      if (exercises && exercises.length) {
          var exercises = JSON.parse(JSON.stringify(exercises));
          for (var i = 0; i < exercises.length; i++) {
            var date = exercises[i].date;
            if (!date) {
              date = new Date(Date.now()).toDateString();
            } else {
              const parts = date.split("-");
              const year = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1;
              const day = parseInt(parts[2]);

              const utcDate = new Date(Date.UTC(year, month, day));
              date = new Date(
                utcDate.getTime() + utcDate.getTimezoneOffset() * 60000
              ).toDateString();
            }
            exercises[i].date = date;
          }
          console.error(exercises);
          var log = {
            _id: user._id,
            username: user.username,
            count: exercises.length,
            log: exercises,
          };
          res.json(log);
        } else {
          console.error("log not found");
          res.json({ error: "User log not found." });
        }
    } else {
      res.json({ error: "User not found." });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});