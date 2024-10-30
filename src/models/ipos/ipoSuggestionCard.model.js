import mongoose,{Schema} from "mongoose";

const ipoSuggestionCardSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    logo: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    subCategory: {
      type: String,
      required: true,
      trim: true,
    },
    change: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    chartData: {
      type: [
        {
          label: {
            type: String,
            required: true,
          },
          value: {
            type: Number,
            required: true,
          },
        },
      ],
      required: true,
    },
  },
  { timestamps: true }
);

const IPOSuggestionCard = mongoose.model(
  "IPOSuggestionCard",
  ipoSuggestionCardSchema
);

export default IPOSuggestionCard;
