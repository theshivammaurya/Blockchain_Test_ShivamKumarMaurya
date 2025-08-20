const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const Stake = require("./models/Stake");

const app = express();
const PORT = process.env.PORT || 5000;

// connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
})
.then(() => console.log(" MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));