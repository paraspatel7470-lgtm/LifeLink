const mongoose = require("mongoose");

const DonorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",          
      required: true,
      unique: true
    },

    phone: {
      type: String,
      default: ""
    },

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true
    },

    // GeoJSON point for location: { type: "Point", coordinates: [lng, lat] }
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },

    available: {
      type: Boolean,
      default: true
    },

    lastDonationDate: {
      type: Date,
      default: null
    },

    donationCount: {
      type: Number,
      default: 0
    },

    // optional fields
    city: { type: String, default: "" },
    state: { type: String, default: "" }
  },
  { timestamps: true }
);

// Create 2dsphere index required for geospatial queries
DonorSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Donor", DonorSchema);
