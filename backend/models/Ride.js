
const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

driverId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

driverName: {
  type: String,
  default: "",
  trim: true,
},

    passengerName: {
      type: String,
      required: true,
      trim: true,
    },

    passengerPhone: {
      type: String,
      required: true,
      trim: true,
    },

    pickupLocation: {
      type: String,
      required: true,
      trim: true,
    },

    dropoffLocation: {
      type: String,
      required: true,
      trim: true,
    },

    rideType: {
      type: String,
      enum: ["mini", "go", "xl"],
      required: true,
      default: "go",
    },

    fare: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "started", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ride", rideSchema);

