import mongoose, { Schema } from "mongoose";

const KeyObjectiveSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ScheduleSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
  },
  { _id: false }
);

const AdvantageSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const DisadvantageSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

// Define the main schema for IPO details
const IPODetailsSchema = new Schema(
  {
    companyDescription: { type: String, required: true, trim: true },
    keyObjectives: { type: [KeyObjectiveSchema], required: true },
    schedule: { type: [ScheduleSchema], required: true },
    advantages: { type: [AdvantageSchema], required: true },
    disadvantages: { type: [DisadvantageSchema], required: true },
  },
  { _id: false }
);

const IPODataSchema = new Schema(
  {
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    logo: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    ipoStartDate: { type: Date, required: true },
    ipoEndDate: { type: Date, required: true },
    listingDate: { type: Date, required: true },
    type: { type: String, required: true, trim: true },
    sentimentScore: {
      type: mongoose.Decimal128,
      required: true,
      validate: {
        validator: (value) => value >= 0 && value <= 1,
        message: "Sentiment score must be between 0 and 1.",
      },
    },
    decisionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    priceStartRange: { type: String, required: true, trim: true },
    priceEndRange: { type: String, required: true, trim: true },
    minQuantity: { type: Number, required: true, min: 1 },
    typeBackground: {
      background: { type: String, required: true, trim: true },
      borderImageSource: { type: String, required: true, trim: true },
      boxShadow: { type: String, required: true, trim: true },
    },
    details: { type: IPODetailsSchema, required: true },
  },
  { timestamps: true }
);

// Added indexes to improve query performance on commonly searched fields
IPODataSchema.index({ name: 1 });
IPODataSchema.index({ type: 1 });

const IPOData = mongoose.model("IPOData", IPODataSchema);

export default IPOData;
