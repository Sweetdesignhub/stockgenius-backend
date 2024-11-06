import mongoose, { Schema } from "mongoose";

const KeyObjectiveSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
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


const IPODataSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    logo: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    ipoStartDate: { type: Date, required: true },
    ipoEndDate: { type: Date, required: true },
    listingDate: { type: Date, required: true },
    basisOfAllotment: { type: Date, required: true },
    initiationOfRefunds: { type: Date, required: true },
    creditShares: { type: Date, required: true },
    category: {
      type: String,
      required: true,
      enum: ["UPCOMING", "ONGOING", "PAST"],
    },
    exchangeType: {
      type: String,
      required: true,
      enum: ["SME", "DEBT", "EQUITY"],
    },
    sentimentScore: { type: Number, required: true, trim: true },
    decisionRate: {
      type: Number,
      required: true,
    },
    priceStartRange: { type: String, required: true, trim: true },
    priceEndRange: { type: String, required: true, trim: true },
    minQuantity: { type: Number, required: true, min: 1 },
    companyDescription: { type: String, required: true, trim: true },
    keyObjectives: { type: [KeyObjectiveSchema], required: true },
    advantages: { type: [AdvantageSchema], required: true },
    disadvantages: { type: [DisadvantageSchema], required: true },
  },
  { timestamps: true }
);

IPODataSchema.index({ name: 1 });
IPODataSchema.index({ exchangeType: 1 });

const IPOData = mongoose.model("IPOData", IPODataSchema);

export default IPOData;
