const express = require("express");
const router = express.Router();
const {
  registerHospital,
  findDonorsForSOS,
} = require("../controllers/hospitalController");

// Register hospital profile
router.post("/register", registerHospital);

// SOS request → find donors
router.post("/sos", findDonorsForSOS);

module.exports = router;


const Hospital = require("../models/Hospital");
const protect = require("../middleware/authMiddleware");

router.post("/update-location", protect, async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { latitude, longitude } = req.body;

    await Hospital.findOneAndUpdate(
      { user: req.user.id },
      {
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to update location" });
  }
});
