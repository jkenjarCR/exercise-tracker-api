const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB database config via Mongoose
function connect_to_db() {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}
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
// end MongoDB database config via Mongoose

// middleware config
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
// end middleware config

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

app.get("/api/users/:_id/logs", async (req, res) => {
  var userId = req.params._id;
  var { from, to, limit } = req.query;
  var filter = { userId };

  if (from || to) {
    filter.date = {};
    if (from) filter.date["$gte"] = new Date(from);
    if (to) filter.date["$lte"] = new Date(to);
  }

  var user = await User.findById(userId);

  if (user && user._id == userId) {
    var exercises = await ExerciseInfo.find(filter).limit(
      parseInt(limit) ? parseInt(limit) : 500
    );

    exercises = exercises.map((x) => {
      return {
        description: x.description,
        duration: x.duration,
        date: new Date(x.date).toDateString(),
      };
    });

    res.json({
      _id: userId,
      username: user.username,
      count: exercises.length || 0,
      log: exercises,
    });
  } else {
    res.json({ error: "User not found!" });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
