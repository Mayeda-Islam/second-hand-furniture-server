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
  const ordersCollection = SHF_DB.collection("orders");
  const usersCollection = SHF_DB.collection("users");
  const favByUsersCollection = SHF_DB.collection("favByUsers");
  const reviewsCollection = SHF_DB.collection("reviews");
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

    app.get("/products/category/:categoryId", async (req, res) => {
      const categoryId = req.params.categoryId;
      const filterId = { category_id: categoryId };
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
    app.post("/orders", async (req, res) => {
      const orders = req.body;
      const result = await ordersCollection.insertOne(orders);
      res.send(result);
    });
    //update orders api
    app.patch("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const updatedOrders = req.body;
      try {
        const query = { _id: ObjectId(id) };
        console.log(updatedOrders);
        const updateDoc = {
          $set: updatedOrders,
        };
        const result = await ordersCollection.updateOne(query, updateDoc);
        res.status(200).json(result);
      } catch (err) {
        res.status(503).json({
          status: 503,
          message: "server error",
        });
      }
    });
    //  get booking api
    app.get("/orders", async (req, res) => {
      const query = {};
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    });

    // Add product
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

    // //Get product using product id
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      console.log(filter);
      try {
        const result = await productsCollection.findOne(filter);
        return res.status(200).json(result);
      } catch (error) {
        return res.status(500).json(error);
      }
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

    // update product by adding favorite by user field
    // app.patch("/products/favorite/:productId/:userId", async (req, res) => {
    //   const productId = req.params.productId;
    //   const userId = req.params.userId;
    //   const filter = { _id: ObjectId(productId) };
    //   const updateDoc = {
    //     $addToSet: {
    //       favByUsers: userId,
    //     },
    //   };

    //   const result = await productsCollection.updateOne(filter, updateDoc);
    //   res.send(result);
    // });

    // delete product
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });
    // delete favByUser
    app.delete("/favorite/:productId/:email", async (req, res) => {
      const email = req.params.email;
      const productId = req.params.productId;
      const filter = { productId, email };
      const result = await favByUsersCollection.deleteOne(filter);
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
    //Add new categories
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
    app.post("/favorite", async (req, res) => {
      const product = req.body;
      const favorite = await favByUsersCollection.insertOne(product);
      res.send(favorite);
    });
    app.get("/favorite/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email };
      const result = await favByUsersCollection.find(filter).toArray();
      res.send(result);
    });
    app.get("/favorite", async (req, res) => {
      const query = {};
      if (query) {
        const result = await favByUsersCollection.find(query).toArray();
        res.send(result);
      }
    });
    app.post("/reviews", async (req, res) => {
      const dateAndTime = new Date().toLocaleString();
      const review = { ...req.body, dateAndTime };

      const reviews = await reviewsCollection.insertOne(review);
      res.send(reviews);
    });
    app.get("/reviews", async (req, res) => {
      const query = {};
      const reviews = await reviewsCollection.find(query).toArray();
      res.send(reviews);
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
