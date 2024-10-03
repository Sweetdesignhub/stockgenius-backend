import mongoose, { Schema } from "mongoose";


// Define the position schema
const positionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    tradingsymbol: {
      type: String,
      required: true,
    },
    exchange: {
      type: String,
      required: true,
    },
    instrument_token: {
      type: Number,
      required: true,
    },
    product: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    overnight_quantity: {
      type: Number,
      default: 0,
    },
    multiplier: {
      type: Number,
      required: true,
    },
    average_price: {
      type: Number,
      required: true,
    },
    close_price: {
      type: Number,
      default: 0,
    },
    last_price: {
      type: Number,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    pnl: {
      type: Number,
      required: true,
    },
    m2m: {
      type: Number,
      default: 0,
    },
    unrealised: {
      type: Number,
      required: true,
    },
    realised: {
      type: Number,
      default: 0,
    },
    buy_quantity: {
      type: Number,
      required: true,
    },
    buy_price: {
      type: Number,
      required: true,
    },
    buy_value: {
      type: Number,
      required: true,
    },
    buy_m2m: {
      type: Number,
      required: true,
    },
    sell_quantity: {
      type: Number,
      default: 0,
    },
    sell_price: {
      type: Number,
      default: 0,
    },
    sell_value: {
      type: Number,
      default: 0,
    },
    sell_m2m: {
      type: Number,
      default: 0,
    },
    day_buy_quantity: {
      type: Number,
      required: true,
    },
    day_buy_price: {
      type: Number,
      required: true,
    },
    day_buy_value: {
      type: Number,
      required: true,
    },
    day_sell_quantity: {
      type: Number,
      default: 0,
    },
    day_sell_price: {
      type: Number,
      default: 0,
    },
    day_sell_value: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);


export default positionSchema;