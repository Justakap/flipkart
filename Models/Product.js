const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productTitle: { type: String, required: true },
  productActualPrice: { type: Number, required: true },
  productSalePrice: { type: Number },
  productOffers: [{ type: String }],
  productVariant: {
    Colour: { type: String, required: true },

    Storage: { type: String, required: true },
  },
  productDescription: { type: String, required: true },
  productHighlights: [{ type: String }],
  productImages: [
    {
      type: String,
    },
  ],
  productCategory: { type: String },
  availableQty: { type: Number },
});

module.exports = mongoose.model("products", productSchema);
