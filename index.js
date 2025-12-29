// index.js
import express, { json } from "express";
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
  const dataapi = await fetch('https://jsonplaceholder.typicode.com/posts');
  const data = await dataapi.json()
  await redisClient.set("posts", JSON.stringify(data), { EX: 3600 });
  res.send(data);
});
// https://www.youtube.com/watch?v=Vx2zPMPvmug&t=4530s
// Get a value
app.get("/get", async (req, res) => {
  const value = await redisClient.get("posts");
  const parsedValue = JSON.parse(value);
  res.send(parsedValue[1]);
});

// Update a value
app.get("/updatename", async (req, res) => {
  const NameUpdated = await redisClient.append("name", " Reddy");
  // console.log(NameUpdated,'NameUpdated')
  res.send("Value updated from Redis", NameUpdated);
});

app.get("/lpush", async (req, res) => {
  try {
    const res1 = await redisClient.lPush('mylist', 'world');
    console.log(res1); // 1    await redisClient.lpush("mylist", "value2");
    // const res2 = await redisClient.lPush('mylist', 'world');
    // console.log(res2); // 
    res.send("Values pushed to Redis list", res1);
  } catch (error) {
    console.log(error.message)
  }
});


// Get list values
app.get("/lrange", async (req, res) => {
  try {
    const listValues = await redisClient.lRange("mylist", 0, -1);
    console.log(listValues, 'listValues')
    res.send(`List values from Redis: ${listValues}`);
  } catch (error) {
    console.log(error.message)
  }
}
);

app.get("/addset", (req, res) => {
  try {
    redisClient.sAdd('myset', 'value1');
    redisClient.sAdd('myset', 'value2');
    redisClient.sAdd('myset', 'value3');
    res.send("Values added to Redis set");
  } catch (error) {
    console.log(error.message)
  }
});

app.get("/deleteset", async (req, res) => {
  try {
    const deletedCount = await redisClient.del('myset');  
    console.log(deletedCount,'deletedCount')
   
    res.send(`Deleted ${deletedCount} set(s) from Redis`);
  } catch (error) {
    console.log(error.message)
  }
});

app.get("/getset", async (req, res) => {
  try {
    const setValues = await redisClient.sMembers('myset');  
    console.log(setValues,'setValues')
    res.send(`Set values from Redis: ${setValues}`);
  } catch (error) {
    console.log(error.message)
  }
});

app.get(`/getsetismember/:qrueryValue`, async (req, res) => {
  try {
    const qrueryValue = req.params.qrueryValue;
    console.log(qrueryValue,';qrueryValue')
    const setValues = await redisClient.sIsMember('myset',qrueryValue);  
     const setValuess = await redisClient.sMembers('myset');  
    console.log(setValuess,'setValuess')
    res.send(`Set values from Redis: ${setValues}`);
  } catch (error) {
    console.log(error.message)
  }
});

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));
export default app;