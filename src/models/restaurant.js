import mongoose from "mongoose";

const timingSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
  },
  openTime: { type: String, required: true }, // e.g., "09:00"
  closeTime: { type: String, required: true }, // e.g., "22:30"
  isClosed: { type: Boolean, default: false }, // For marking holidays or specific days off
});

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    timings: [timingSchema],
    // Override flag if you manually want to shut down operations instantly
    isManuallyClosed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;
