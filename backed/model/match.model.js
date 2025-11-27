import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ["goal", "yellow_card", "red_card", "foul"],
    required: true
  },
  team: {
    type: String,
    enum: ["teamA", "teamB"],
    required: true
  },
  player: {
    type: String,
    required: true
  },
  minute: {
    type: Number,
    required: true
  }
}, { _id: true });




const matchSchema = new mongoose.Schema({
  teamA: {
    type: String,
    required: true
  },
  teamB: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "ongoing", "finished"],
    default: "pending"
  },
  time: {
    type: Number,
    default: 0
  },
  scoreA: {
    type: Number,
    default: 0
  },
  scoreB: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    required: true
  },
  competition: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  events:{
    type:[eventSchema],
    default:[]
  }
}, {
  timestamps: true
});

const Match = mongoose.model("Match", matchSchema);
export default Match;