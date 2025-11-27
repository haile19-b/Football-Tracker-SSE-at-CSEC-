import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./route/match.route.js";
import { ConnectDB } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  return res.json({message:"Football Tracker Server is Running"});
});

app.use("/api/match", router);

app.listen(PORT, async() => {
    await ConnectDB();
    console.log(`Server is running on port http://localhost:${PORT}`);
});