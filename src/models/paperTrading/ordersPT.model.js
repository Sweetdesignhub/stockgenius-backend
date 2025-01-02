import  { Schema } from "mongoose";

const OrdersSchema = new Schema(
  {
    stockSymbol: {
      type: String,
      required: true, // The symbol of the stock being traded
    },
    action: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true, // Type of trade
    },
    orderType: {
      type: String,
      enum: ["MARKET", "LIMIT", "STOP_LOSS", "STOP_LIMIT"],
      required: true, // Type of order
    },
    quantity: {
      type: Number,
      required: true, // Quantity of stock to trade
    },
    filledQuantity: {
      type: Number,
      default: 0, // Tracks partially filled orders
    },
    limitPrice: {
      type: Number, // Applicable for LIMIT and STOP_LIMIT orders
    },
    stopPrice: {
      type: Number, // Applicable for STOP_LOSS orders
    },
    tradedPrice: {
      type: Number, // Price at which the trade was executed
    },
    status: {
      type: String,
      enum: ["PENDING", "EXECUTED", "CANCELED", "PARTIALLY_FILLED"],
      default: "PENDING", // Current status of the order
    },
    productType: {
      type: String,
      enum: ["INTRADAY", "CNC"],
      default: "INTRADAY", // Product type (margin or delivery)
    },
    exchange: {
      type: String,
      enum: ["NSE", "BSE"],
      required: true, // Exchange the order is placed on
    },
    orderTime: {
      type: Date,
      default: Date.now, // Timestamp when the order was placed
    },
    remarks: {
      type: String, // Optional remarks for the order
    },
    virtualOrderId: {
      type: String,
      unique: true,
      required: true, // Unique identifier for paper trading orders
    },
    disclosedQuantity: {
      type: Number,
      default: 0, // Optional: Quantity to disclose publicly
    },
  },
  { timestamps: true }
);

// Middleware for validation
OrdersSchema.pre("save", function (next) {
  console.log("OrderType: ", this.orderType);
  console.log("LimitPrice: ", this.limitPrice);

  if (this.orderType === "LIMIT" && !this.limitPrice) {
    console.log("Error: Limit price is missing for LIMIT order.");
    return next(new Error("Limit price is required for LIMIT orders."));
  }

  if (this.orderType === "STOP_LOSS" && !this.stopPrice) {
    console.log("Error: Stop price is missing for STOP_LOSS order.");
    return next(new Error("Stop price is required for STOP_LOSS orders."));
  }

  next();
});


export default OrdersSchema;
