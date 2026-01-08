const express = require("express");
const router = express.Router();
const donorCtrl = require("../controllers/donorController");

// Register donor profile (link to user)
router.post("/register", donorCtrl.registerDonor);

// Update availability
router.patch("/:id/availability", donorCtrl.toggleAvailability);

// Update location
router.patch("/:id/location", donorCtrl.updateLocation);

// Mark donation occurred
router.patch("/:id/donate", donorCtrl.markDonation);

// Get donor profile
router.get("/:id", donorCtrl.getDonor);

// SOS search
router.post("/sos", donorCtrl.findNearbyDonors);

module.exports = router;

const Donor = require("../models/Donor");
const protect = require("../middleware/authMiddleware");

router.post("/update-location", protect, async (req, res) => {
  try {
    if (req.user.role !== "donor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { latitude, longitude } = req.body;

    await Donor.findOneAndUpdate(
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
