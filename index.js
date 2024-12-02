const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

connect_to_db();

const Schema = mongoose.Schema;
const exercise_info_schema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: false, default: Date.now },
});
const user_schema = new Schema({
  username: { type: String, required: true },
});

const ExerciseInfo = mongoose.model("exercise_info", exercise_info_schema);
const User = mongoose.model("user", user_schema);

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
  let userId = req.params._id;

  var exercise_object = {
    date: req.body.date,
    userId: userId,
    description: req.body.description,
    duration: req.body.duration,
  };

  var exercise_model = new ExerciseInfo(exercise_object);
  User.findById(userId, function (err, user) {
    exercise_model.save(function (err, exercise) {
      if (!err) {
        res.json({
          _id: user._id,
          username: user.username,
          description: exercise.description,
          duration: exercise.duration,
          date: new Date(exercise.date).toDateString(),
        });
      } else {
        res.json({ error: "Exercise failed to save." });
      }
    });
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  let fromParam = req.query.from;
  let toParam = req.query.to;
  let limitParam = req.query.limit;
  let userId = req.params._id;

  // If limit param exists set it to an integer
  limitParam = limitParam ? parseInt(limitParam) : limitParam;

  User.findById(userId, (err, userFound) => {
    if (err) return console.log(err);
    console.log(userFound);

    let queryObj = {
      userId: userId,
    };
    // If we have a date add date params to the query
    if (fromParam || toParam) {
      queryObj.date = {};
      if (fromParam) {
        queryObj.date["$gte"] = fromParam;
      }
      if (toParam) {
        queryObj.date["$lte"] = toParam;
      }
    }

    ExerciseInfo.find(queryObj)
      .limit(limitParam)
      .exec((err, exercises) => {
        if (err) return console.log(err);

        let resObj = { _id: userFound._id, username: userFound.username };

        exercises = exercises.map((x) => {
          return {
            description: x.description,
            duration: x.duration,
            date: new Date(x.date).toDateString(),
          };
        });
        resObj.log = exercises;
        resObj.count = exercises.length;

        res.json(resObj);
      });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});