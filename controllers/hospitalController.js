const Hospital = require("../models/Hospital");
const Donor = require("../models/Donor");

exports.registerHospital = async (req, res) => {
  try {
    const { userId, name, phone, address, lat, lng, city, state } = req.body;

    const exists = await Hospital.findOne({ user: userId });
    if (exists)
      return res.status(400).json({ message: "Hospital profile already exists" });

    const hospital = new Hospital({
      user: userId,
      name,
      phone,
      address,
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      city,
      state,
    });

    await hospital.save();

    res.status(201).json({
      message: "Hospital registered successfully",
      hospital,
    });
  } catch (error) {
    res.status(500).json({ message: "Hospital registration failed", error: error.message });
  }
};

exports.findDonorsForSOS = async (req, res) => {
  try {
    const { lat, lng, bloodGroup, maxDistanceMeters = 10000, limit = 10 } = req.body;

    const donors = await Donor.find({
      bloodGroup: bloodGroup,
      available: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: maxDistanceMeters,
        },
      },
    })
      .limit(limit)
      .populate("user");

    res.status(200).json({
      count: donors.length,
      donors,
    });
  } catch (error) {
    res.status(500).json({ message: "SOS search failed", error: error.message });
  }
};
