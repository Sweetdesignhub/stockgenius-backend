import mongoose, { Schema } from "mongoose";

const KeyObjectiveSchema = new Schema(
  {
    title: { type: String, trim: true },
    description: { type: String,trim: true },
  },
  { _id: false }
);

const AdvantageSchema = new Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const DisadvantageSchema = new Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
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
    ipoStartDate: { type: Date},
    ipoEndDate: { type: Date },
    listingDate: { type: Date},
    basisOfAllotment: { type: Date },
    initiationOfRefunds: { type: Date },
    creditShares: { type: Date },
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
    sentimentScore: { type: Number, trim: true },
    decisionRate: {
      type: Number,
    },
    priceStartRange: { type: String, trim: true },
    priceEndRange: { type: String, trim: true },
    minQuantity: { type: Number, min: 1 },
    companyDescription: { type: String, required: true, trim: true },
    keyObjectives: { type: [KeyObjectiveSchema]},
    advantages: { type: [AdvantageSchema] },
    disadvantages: { type: [DisadvantageSchema]},
  },
  { timestamps: true }
);

IPODataSchema.index({ name: 1 });
IPODataSchema.index({ exchangeType: 1 });

const IPOData = mongoose.model("IPOData", IPODataSchema);

export default IPOData;
