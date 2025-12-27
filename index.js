// index.js
import express from "express";
import { createClient } from "redis";

const app = express();
app.use(express.json());

// Redis client
const redisClient = createClient();

redisClient.on("error", (err) => console.log("Redis Client Error", err));

await redisClient.connect();

// Routes
app.get("/", async (req, res) => {
  res.send("Server running ✅");
});

// Set a value
app.get("/set", async (req, res) => {
  await redisClient.set("name", "Tharun");
  res.send("Value set in Redis");
});

// Get a value
app.get("/get", async (req, res) => {
  const value = await redisClient.get("name");
  res.send(`Value from Redis: ${value}`);
});

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));
export default app;