const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: String},
  orderId: { type: String, required: true, unique : true },
  orderStatus: { type: String, required: true },
  cName: { type: String, required: true },
  cEmail: { type: String, required: true },
  cPincode: { type: String, required: true },
  cLocality: { type: String, required: true },
  cPhone: { type: String, required: true },
  cAddress: { type: String, required: true },
  cCity: { type: String, required: true },
  cState: { type: String, required: true },
  products: { type: Object, required: true },
  rzpPaymentId: { type: String, required: true },
  rzpOrderId: { type: String, required: true },
  paymentStatus: { type: String, required: true },
  subTotal: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
});

module.exports = mongoose.model("orders", orderSchema);
