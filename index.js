const express = require("express");
const cors = require("cors");
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
async function run() {
  const categoryCollection = client
    .db("second-hand-furniture")
    .collection("categories");
  const categoryProductCollection = client
    .db("second-hand-furniture")
    .collection("catgoryProduct");
  try {
   app.get('/categories',async(req,res)=>{
    const query={}
    const filter= categoryCollection.find(query)
    const result=await filter.toArray()
    res.send(result)
   })
   app.get('/categories/:id',async(req,res)=>{
    const id=req.params.id;
    const filterId={category_id:id}
    const cursor= categoryProductCollection.find(filterId)
    const result=await cursor.toArray()
    res.send(result)
   
   })
  } finally {
  }
}
run().catch((error) => console.log(error));

app.get("/", (req, res) => {
  res.send("api loading");
});
app.listen(port, () => {
  console.log("inside of port ", port);
});
