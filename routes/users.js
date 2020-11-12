require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {MongoClient} = require('mongodb');

const router = express.Router();

const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASS = process.env.MONGO_PASS;
const MONGO_DB = process.env.MONGO_DB;
const CONNECTION_STRING = `mongodb+srv://${MONGO_USER}:${MONGO_PASS}@cluster0.a009p.mongodb.net/${MONGO_DB}?retryWrites=true&w=majority`;

async function createNewUser(user) {
  const client = new MongoClient(CONNECTION_STRING);

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Make the appropriate DB calls
    const result = await client.db(MONGO_DB).collection('user').insertOne(user);
    // console.log("Users:");
    // console.log(result);

    return result;
  }
  catch (e) {
    console.error(e);
  }
  finally {
    await client.close();
  }
}

async function getUserByUsername(username) {
  const client = new MongoClient(CONNECTION_STRING);

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Make the appropriate DB calls
    const result = await client.db(MONGO_DB).collection('user').findOne({username: username});
    // console.log("Users:");
    // console.log(result);

    return result;
  }
  catch (e) {
    console.error(e);
  }
  finally {
    await client.close();
  }
}

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

/* POST new user */
router.post('/', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = { username: req.body.username, password: hashedPassword };

    createNewUser(user).then((result) => {
      res.status(201).send("User created successfully.");
    });

  }
  catch {
    res.status(500).send();
  }
});

/* POST login a user */
router.post('/login', async (req, res) => {
  getUserByUsername(req.body.username).then(async (result) => {
    if (result == null || result.length < 1) {
      res.status(404).send("User not found.");
    }
    else {
      try {
          if(await bcrypt.compare(req.body.password, result.password)) {
            // login successful -- now send access token
            const token = generateAccessToken({username: req.body.username});
            res.json({access_token: token});
          } else {
            res.status(404).send('Not Allowed');
          }
        }
        catch {
          res.status(500).send();
        }
    }
  });
});

module.exports = router;
