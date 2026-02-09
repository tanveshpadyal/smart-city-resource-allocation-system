const connectDB = require("./models");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server running" });
});

const PORT = process.env.PORT || 5000;
connectDB();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
