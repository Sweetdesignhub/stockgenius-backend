import mongoose, { Schema } from "mongoose";

const activatedBotSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    botType: {
      type: String,
      enum: ['INTRADAY', 'CNC'],
      required: true,
    },
    activationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const ActivatedBot = mongoose.model("ActivatedBot", activatedBotSchema);

export default ActivatedBot;