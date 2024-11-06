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
    graph:{
      type:String,
      default:"https://cdn.builder.io/api/v1/image/assets%2F462dcf177d254e0682506e32d9145693%2F441bdc029fa94bc2a826244254476776"
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
      // required: true,
    },
  },
  { timestamps: true }
);

const IPOSuggestionCard = mongoose.model(
  "IPOSuggestionCard",
  ipoSuggestionCardSchema
);

export default IPOSuggestionCard;
