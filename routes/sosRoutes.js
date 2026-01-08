const express = require("express");
const router = express.Router();

const {
  createSOS,
  getActiveSOS,
  acceptSOS,
  getHospitalSOS,
} = require("../controllers/sosController");

const protect = require("../middleware/authMiddleware");

// Hospital creates SOS
router.post("/create", protect, createSOS);

// Donor fetches active SOS
router.get("/active", protect, getActiveSOS);

// Donor accepts SOS (new route for frontend)
router.post("/accept", protect, acceptSOS);

// hospital see accept donor on dashboard
router.get("/hospital", protect, getHospitalSOS);

module.exports = router;


