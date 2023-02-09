const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
  jwt.verify(token, process.env.TOKEN, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  const SHF_DB = client.db("second-hand-furniture");

  const categoryCollection = SHF_DB.collection("categories");
  const productsCollection = SHF_DB.collection("products");
  const blogsCollection = SHF_DB.collection("blogs");
  const bookingsCollection = SHF_DB.collection("bookings");
  const usersCollection = SHF_DB.collection("users");

  try {
    // jwt post
    app.post("/jwt", (req, res) => {
      const user = req.body;
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

    app.get("/products/category/:id", async (req, res) => {
      const id = req.params.id;
      const filterId = { category_id: id };
      const cursor = productsCollection.find(filterId);
      const products = await cursor.toArray();
      res.send(products);
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

    //post product
    app.post("/products", async (req, res) => {
      const addProduct = req.body;
      const result = await productsCollection.insertOne(addProduct);
      res.send(result);
    });

    // Get Products
    app.get("/products", async (req, res) => {
      let query = {};
      const sellerId = req.query.sellerId;
      const isAdvertising = req.query.isAdvertising;
      if (sellerId) {
        query.sellerId = sellerId;
      }
      if (isAdvertising === "true") {
        query.isAdvertising = true;
      } else if (isAdvertising === "false") {
        query.isAdvertising = false;
      }
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // update product by adding favorite by user field
    app.patch("/products/favorite/:productId", async (req, res) => {
      const productId = req.params.productId;
      // const userId = req.params.userId;
      const filter = { _id: ObjectId(productId) };
      const updateDoc = {
        $push: {
          favByUsers: {
            ...req.body,
          },
        },
      };

      const result = await productsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Update product
    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProductData = req.body;
      const query = { _id: ObjectId(id) };
      const updateDoc = {
        $set: updatedProductData,
      };
      const result = await productsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // delete product
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // user post
    app.post("/users", async (req, res) => {
      const users = req.body;
      const result = await usersCollection.insertOne(users);
      res.send(result);
    });
    // get users
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });
    // make user admin
    app.put("/users/role/:id", verifyJwt, async (req, res) => {
      const email = req.decoded.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res.status(403).send({ message: "unauthorized access" });
      } else {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updatedDoc = {
          $set: {
            ...req.body,
          },
        };
        const result = await usersCollection.updateOne(
          filter,
          updatedDoc,
          options
        );
        res.send(result);
      }
    });
    //advertise product post
    app.post("/categories/:id", async (req, res) => {
      const product = req.body;
      const result = await categoryCollection.insertOne(product);
      res.send(result);
    });

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
