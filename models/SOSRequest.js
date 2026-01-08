const mongoose = require("mongoose");

const sosRequestSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    bloodGroup: {
      type: String,
      required: true,
    },

    unitsRequired: {
      type: Number,
      required: true,
    },

    unitsFulfilled: {
      type: Number,
      default: 0,
    },

    urgency: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["pending","fulfilled", "expired"],
      default: "pending",
    },

    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    donorsResponded: [
      {
        donorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        respondedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 6 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SOSRequest", sosRequestSchema);
