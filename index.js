const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xin2ksw.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.send(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  const categoryCollection = client
    .db("second-hand-furniture")
    .collection("categories");
  const categoryProductCollection = client
    .db("second-hand-furniture")
    .collection("catgoryProduct");
  const blogsCollection = client
    .db("second-hand-furniture")
    .collection("blogs");
  const bookingsCollection = client
    .db("second-hand-furniture")
    .collection("bookings");
  const addProductCollection = client
    .db("second-hand-furniture")
    .collection("addProduct");
  const usersCollection = client
    .db("second-hand-furniture")
    .collection("users");
  try {
    // jwt post
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.TOKEN, {
        expiresIn: "1h",
      });
      if (token) {
        res.send({ status: true, token });
      } else {
        res.send({ status: false });
      }
    });

    app.get("/categories", async (req, res) => {
      const query = {};
      const filter = categoryCollection.find(query);
      const result = await filter.toArray();
      res.send(result);
    });

    app.get("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const filterId = { category_id: id };
      const cursor = categoryProductCollection.find(filterId);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/blogs", async (req, res) => {
      const query = {};
      const result = await blogsCollection.find(query).toArray();
      res.send(result);
    });

    //  post booking api
    app.post("/bookings", async (req, res) => {
      const bookings = req.body;
      const result = await bookingsCollection.insertOne(bookings);
      res.send(result);
    });
    //  get booking api
    app.get("/bookings", async (req, res) => {
      const query = {};
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    // add product post
    app.post("/addProduct", async (req, res) => {
      const addProduct = req.body;
      const result = await addProductCollection.insertOne(addProduct);
      res.send(result);
    });
    // my product
    app.get("/product", async (req, res) => {
      const query = {};
      const result = await addProductCollection.find(query).toArray();
      res.send(result);
    });

    // user post
    app.post("/users", async (req, res) => {
      const users = req.body;
      const result = await usersCollection.insertOne(users);
      res.send(result);
    });
    //
    app.get("/users-by-email/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      if (user?.email) {
        res.send({ status: true, user });
      } else {
        res.send({ status: false });
      }
    });
  } finally {
  }
}
run().catch((error) => console.log(error));

app.get("/", (req, res) => {
  res.send("api loading second hand furniture");
});
app.listen(port, () => {
  console.log("inside of port ", port);
});
