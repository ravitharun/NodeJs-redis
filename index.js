// index.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import fetch from 'node-fetch';
import { createClient } from 'redis';

const app = express();
app.use(express.json());
const pubClient = createClient();
pubClient.connect();
// --------------------
// Redis Client (auto-connect)
// --------------------
const redisClient = new Redis(); // ioredis auto connects
redisClient.on('connect', () => console.log('Redis connected ✅'));
redisClient.on('error', (err) => console.log('Redis Error:', err));

// --------------------
// Rate Limiter
// --------------------
const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 5 * 60 * 1000, // 15 minutes 300000 ms
  max: 100, // max 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Try again later.',
});
const loginlimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 5 * 60 * 1000, // 15 minutes 300000 ms
  max: 100, // max 100 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Try again later.',
});

app.use(limiter);
app.use(loginlimiter);

// --------------------
// Routes
// --------------------

// Test server
app.get('/', (req, res) => {
  res.send('Server running ✅');
});







app.get('/test', async (req, res) => {
  try {
    // 1. Increment counter (DO NOT set to 0)
    const count = await redisClient.incr('test_counter');

    // 2. Set expiry ONLY the first time
    if (count === 1) {
      await redisClient.expire('test_counter', 60); // 60 seconds
    }

    // 3. Block after limit
    if (count > 10) {
      return res.status(429).send('Limit reached. Try again later.');
    }

    res.send(`Test route accessed ${count} times`);
  } catch (err) {
    res.status(500).send('Error');
  }
});







// Set posts in Redis
app.get('/set', limiter, async (req, res) => {

  try {
    console.log(limiter, 'limiter')
    const cachedData = await redisClient.get('posts');
    if (cachedData) return res.send(JSON.parse(cachedData));

    const dataApi = await fetch('https://jsonplaceholder.typicode.com/posts');
    const data = await dataApi.json();

    await redisClient.set('posts', JSON.stringify(data), 'EX', 3600);
    res.send(data);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error fetching data');
  }
});

// Get posts
app.get('/get', limiter, async (req, res) => {
  try {

    const value = await redisClient.get('posts');
    if (!value) return res.send('No data found in Redis');
    const parsedValue = JSON.parse(value);
    res.send(parsedValue[1]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error getting data');
  }
});

// Append value
app.get('/updatename', async (req, res) => {
  try {
    const nameUpdated = await redisClient.append('name', ' Reddy');
    res.send(`Value updated in Redis: ${nameUpdated}`);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error updating value');
  }
});

// LPUSH to list
app.get('/lpush', async (req, res) => {
  try {
    const result = await redisClient.lPush('mylist', 'world');
    res.send(`Values pushed to Redis list: ${result}`);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error pushing to list');
  }
});

// LRANGE list
app.get('/lrange', async (req, res) => {
  try {
    const listValues = await redisClient.lRange('mylist', 0, -1);
    res.send(`List values from Redis: ${listValues}`);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error reading list');
  }
});

// Add values to set
app.get('/addset', async (req, res) => {
  try {
    await redisClient.sAdd('myset', 'value1', 'value2', 'value3');
    res.send('Values added to Redis set');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error adding to set');
  }
});

// Delete set
app.get('/deleteset', async (req, res) => {
  try {
    const deletedCount = await redisClient.del('myset');
    res.send(`Deleted ${deletedCount} set(s) from Redis`);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error deleting set');
  }
});

// Get set members
app.get('/getset', async (req, res) => {
  try {
    const setValues = await redisClient.sMembers('myset');
    res.send(`Set values from Redis: ${setValues}`);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error getting set values');
  }
});

// Check if member exists in set
app.get('/getsetismember/:queryValue', async (req, res) => {
  try {
    const queryValue = req.params.queryValue;
    const isMember = await redisClient.sIsMember('myset', queryValue);
    res.send(`Is "${queryValue}" in set? : ${isMember}`);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error checking set member');
  }
});


// pub means publish send the message
app.get("/send", async (req, res) => {
  try {
    await pubClient.publish("events", "User logged in");
    res.send("Message sent");

  }
  catch (error) {
    console.error(error.message);
    res.status(500).send('Error sending message');
  }
});





// sub means subscribe receive the message
app.get("/receive", async (req, res) => {
  try {
    const subClient = createClient();
    await subClient.connect();
    await subClient.subscribe("events", (message) => {
      console.log("Received message:", message);
      res.send(`Message received: ${message}`);
    });
  }
  catch (error) {
    console.error(error.message);
    res.status(500).send('Error receiving message');
  }
});
// webscoket (emi,on)==>emit means send the message [(on)---> means receive the message]
// ------------------------------------------------------------
// Pub/Sub with ioredis
// --------------------------------------------------

// emit and publish are same (send the message  to the server) and (on and subscribe) are same(receive the message from the server)

// --------------------
// Start server
// --------------------




app.listen(3000, () => console.log('Server running on port 3000'));
