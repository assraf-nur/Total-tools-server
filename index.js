const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// connect mongo
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wu6pcws.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// apply JWT
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decode) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decode;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db("totalTools").collection("tools");
    const usersCollection = client.db("totalTools").collection("users");
    const ordersCollection = client.db("totalTools").collection("orders");
    const reviewsCollection = client.db("totalTools").collection("reviews");
    const wishCollection = client.db("totalTools").collection("wish");

    app.get("/tools", async (req, res) => {
      const query = {};
      const cursor = toolsCollection.find(query);
      const tools = await cursor.toArray();
      res.send(tools);
    });

    app.get("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.findOne(query);
      res.send(result);
    });

    app.post("/orders", async (req, res) => {
      const newOrder = req.body;
      const result = await ordersCollection.insertOne(newOrder);
      res.send(result);
    });

    // reviews
    app.post('/reviews', async (req,res) =>{
      const newReview = req.body;
      const result = await reviewsCollection.insertOne(newReview);
      res.send(result);
    });

    app.get('/reviews', async (req, res) =>{
      const query = {};
      const cursor = reviewsCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // wishlist
    app.post('/wish', async (req, res) => {
      const newWish = req.body;
      const result = await wishCollection.insertOne(newWish);
      res.send(result);
    })

    app.get('/wishes', async (req, res) =>{
      const query = {};
      const cursor = wishCollection.find(query);
      const wishes = await cursor.toArray();
      res.send(wishes);
    });

    app.post('/tools', async(req, res) => {
      const newTools = req.body;
      const result = await toolsCollection.insertOne(newTools);
      res.send(result);
    })

    app.get("/orders", async (req, res) => {
      const userEmail = req.query.userEmail;
      const query = { userEmail: userEmail };
      const singleOrders = await ordersCollection.find(query).toArray();
      res.send(singleOrders);
    });
    app.get("/allOrders", async (req, res) => {
      const query = { };
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });

    // users
    app.get('/users/:email', async(req, res) =>{
      const email = req.params.email;
      const query = {email: email};
      const result = await usersCollection.findOne(query);
      res.send(result);
    })

    app.put('/users/:email', async(req, res)=>{
      const email = req.params.email;
      const updateUser = req.body;
      const filter = {email: email};
      const options = {upsert: true};
      const updatedDoc = {
          $set: updateUser,
      };
      const result = await usersCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
  })

    app.delete('/users/:id', async (req, res) =>{
        const id = req.params.id;
        const query = {_id: ObjectId(id)};
        const result = await usersCollection.deleteOne(query);
        res.send(result);
    })

    app.delete('/tools/:id', async (req, res) =>{
        const id = req.params.id;
        const query = {_id: ObjectId(id)};
        const result = await toolsCollection.deleteOne(query);
        res.send(result);
    })

    

    app.get('/admin/:email', async (req, res) =>{
      const email = req.params.email;
      const user = await usersCollection.findOne({email: email});
      const isAdmin = user.role === 'admin';
      res.send({admin: isAdmin});
    })

    app.put("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Tools are cutting the server");
});

app.listen(port, () => {
  console.log("Server is running");
});
