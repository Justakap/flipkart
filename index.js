const express = require("express");
const app = express();
const port = 3001;
var cors = require("cors");
const productSchema = require("./Models/Product");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const userSchema = require("./Models/Users");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const orderSchema = require("./Models/Orders");
require('dotenv').config();


main().catch((err) => console.log(err));

async function main() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );
    console.log("Connection to Mongodb is success");
  } catch (error) {
    console.log(error);
  }
}

// --------------------------apis--------------------------------------

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const rzp = new Razorpay({
  key_id: process.env.RZP_ID,
  key_secret: process.env.RZP_SECRET,
});

app.get("/pincodes", (req, res) => {
  res.status(200).json([302021, 302022]);
});

app.get("/fetchProducts", async (req, res) => {
  try {
    await productSchema.find().then((products) => {
      res.status(200).json({ Products: products });
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/fetchProductFilters/:fid", async (req, res) => {
  try {
    const fid = req.params.fid;

    const products = await productSchema.find({ productId: fid });

    // Initialize product_api_data for each request
    const product_api_data = {};

    products.forEach((product) => {
      const color = product.productVariant.Colour;
      const storage = product.productVariant.Storage;
      const productId = product._id;

      if (!product_api_data[color]) {
        // If color is not in the object, initialize it with an empty object
        product_api_data[color] = {};
      }

      // Set product ID for the specific storage title


        product_api_data[color][storage] = {
          id: productId,
          image: product.productImages[0],
          qty: product.availableQty,
        };
    
    });

    res.status(200).json({ Products: product_api_data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/fetchProductById/:id", async (req, res) => {
  try {
    let pid = req.params.id;
    await productSchema.findById(pid).then((product) => {
      res.status(200).json({ Product: product });
    });
  } catch (error) {
    res.status(200).json({ Product: [false] });
  }
});

app.post("/addProducts", async (req, res) => {
  try {
    const newProduct = new productSchema(req.body);
    await newProduct.save();
    res.status(200).json({ msg: "Product successfully added" });
  } catch (error) {
    console.log(error);
  }
});

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

app.post("/signup", async (req, res) => {
  try {
    const newUser = new userSchema({
      useremail: req.body.useremail,
      password: hashPassword(req.body.password),
    });

    const user = await userSchema.find({ useremail: req.body.useremail });

    if (user.length > 0) {
      res.status(200).json({ msg: false });
    } else {
      res.status(200).json({ msg: true });
      await newUser.save();
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/login", async (req, res) => {
  try {
    const useremail = req.body.useremail;
    const password = req.body.password;

    const user = await userSchema.find({
      useremail: req.body.useremail,
      password: hashPassword(req.body.password),
    });

    if (user.length == 1) {
      const token = jwt.sign(
        {
          data: { success: true, useremail: useremail },
        },
        "secret"
      );

      res.status(200).json({ success: true, token: token });
    } else {
      res.status(200).json({ success: false });
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/createOrder", async (req, res) => {
  try {
    const rzpOrder = await rzp.orders.create({
      amount: req.body.amount * 100, // rzp format with paise
      currency: "INR",
      receipt: "receipt#1", //Receipt no that corresponds to this Order,
      payment_capture: true,
      notes: {
        orderType: "Pre",
      }, //Key-value pair used to store additional information
    });

    res.status(200).json({ rzpOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/verifyPayment", async (req, res) => {
  try {
    const payment = await rzp.payments.fetch(req.body.payment_id);
    res.status(200).json(payment);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/saveOrder", async (req, res) => {
  try {
    await orderSchema(req.body).save();

    // Loop through each product in req.body.products
    for (const itemCode in req.body.products) {
      const products = await req.body.products[itemCode];



      await productSchema.findByIdAndUpdate(
        itemCode,
        { $inc: { availableQty: -products.itemQty } }
      );
    }

    // Send success response if all updates are successful
    res.status(200).json({ message: "Order saved successfully" });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.listen(port, () => {
  console.log(`App working on port: ${port}`);
});
