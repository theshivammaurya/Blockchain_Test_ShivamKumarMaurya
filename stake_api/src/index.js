import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import stakeRoutes from "./routes/stake.js";
import governanceRoutes from "./routes/governance.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", stakeRoutes);
app.use("/api", governanceRoutes);

app.get("/", (req, res) => res.send("Staking + Governance API Running "));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
