const SOSRequest = require("../models/SOSRequest");
const Hospital = require("../models/Hospital");
const Notification = require("../models/Notification");
const Donor = require("../models/Donor");
const { getCompatibleDonorGroups } = require("../utils/bloodCompatibility");
const { io } = require("../server");
const User = require("../models/user");
// 🔒 Fixed radius levels (meters)
const RADIUS_LEVELS = [10000, 20000, 50000]; // 10km → 20km → 50km
const COOLDOWN_DAYS = 56;

/**
 * 🏥 Hospital creates SOS
 */
exports.createSOS = async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({ message: "Only hospitals can create SOS" });
    }

    const { bloodGroup, units, urgency } = req.body;

    if (!bloodGroup || !units || !urgency) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Fetch hospital correctly
    const hospital = await Hospital.findOne({ user: req.user.id });

    if (!hospital || !hospital.location) {
      return res.status(404).json({ message: "Hospital location not found" });
    }

    // ✅ Store HOSPITAL _id (not user id)
    const sos = await SOSRequest.create({
      hospitalId: hospital._id,
      bloodGroup,
      urgency,
      status: "pending",
      donorsResponded: [],
      unitsRequired: units,
      unitsFulfilled: 0,
    });

    // Emit after creation
    // io.emit("sos_created", sos);

    // 🔔 Notify compatible donors by distance
    try {
      const compatibleGroups = getCompatibleDonorGroups(bloodGroup);

      let donors = [];
      for (const radius of RADIUS_LEVELS) {
        donors = await Donor.find({
          bloodGroup: { $in: compatibleGroups },
          available: true,
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: hospital.location.coordinates,
              },
              $maxDistance: radius,
            },
          },
        }).select("user");
        if (donors.length > 0) break;
      }

      if (donors.length > 0) {
        const notifications = donors.map((donor) => ({
          userId: donor.user,
          sosId: sos._id,
          title: "Emergency Blood Request",
          message: `Urgent need for ${bloodGroup} blood. Can you help?`,
        }));

        await Notification.insertMany(notifications);
      }
    } catch (err) {
      console.error("Notification error:", err.message);
    }

    res.status(201).json({
      success: true,
      message: "SOS created successfully",
      sos,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 🩸 Donor fetches active SOS
 */
exports.getActiveSOS = async (req, res) => {
  try {
    if (req.user.role !== "donor") {
      return res.status(403).json({ message: "Only donors can view SOS" });
    }

    const donor = await Donor.findOne({ user: req.user.id });

    if (!donor || !donor.location) {
      return res.status(404).json({ message: "Donor location missing" });
    }

    // Fetch all active SOS
    const sosList = await SOSRequest.find({
      status: "pending",
      $expr: { $lt: ["$unitsFulfilled", "$unitsRequired"] },
    })
      .populate("hospitalId", "location")
      .sort({ createdAt: -1 });

    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371000;

    const filteredSOS = sosList.filter((sos) => {
      if (!sos.hospitalId || !sos.hospitalId.location) return false;

      // ✅ Correct medical rule direction
      const allowedDonors = getCompatibleDonorGroups(sos.bloodGroup);
      if (!allowedDonors.includes(donor.bloodGroup)) return false;

      const [dLng, dLat] = donor.location.coordinates;
      const [hLng, hLat] = sos.hospitalId.location.coordinates;

      const dLatRad = toRad(hLat - dLat);
      const dLngRad = toRad(hLng - dLng);

      const a =
        Math.sin(dLatRad / 2) ** 2 +
        Math.cos(toRad(dLat)) *
          Math.cos(toRad(hLat)) *
          Math.sin(dLngRad / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      sos._doc.distance = Math.round(distance);

      return distance <= 50000; // 50 km
    });

    res.status(200).json(filteredSOS);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ✅ Donor accepts SOS (SECURED)
 */
exports.acceptSOS = async (req, res) => {
  try {
    if (req.user.role !== "donor") {
      return res.status(403).json({ message: "Only donors can accept SOS" });
    }

    const { sosId } = req.body;

    const sos = await SOSRequest.findById(sosId);
    if (!sos) {
      return res.status(404).json({ message: "SOS not found" });
    }

    if (sos.status !== "pending") {
      return res.status(400).json({ message: "SOS already closed" });
    }

    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    // 🩸 Cooldown check (56 days global)
    if (donor.lastDonationDate) {
      const now = new Date();
      const diffTime = now - donor.lastDonationDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays < COOLDOWN_DAYS) {
        const remainingDays = Math.ceil(COOLDOWN_DAYS - diffDays);

        return res.status(403).json({
          message: `You are in recovery period. You can donate again after ${remainingDays} days.`,
        });
      }
    }

    // ✅ Backend medical validation
    const allowedDonors = getCompatibleDonorGroups(sos.bloodGroup);
    if (!allowedDonors.includes(donor.bloodGroup)) {
      return res.status(403).json({
        message: "You are not medically compatible with this SOS",
      });
    }

    const alreadyAccepted = sos.donorsResponded.some(
      (d) => d.donorId.toString() === req.user.id
    );

    if (alreadyAccepted) {
      return res.status(400).json({ message: "Already accepted" });
    }
    // ✅ Increment leaderboard points (SAFE)
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { donationsCount: 1 },
    });

    sos.unitsFulfilled += 1;
    sos.donorsResponded.push({ donorId: req.user.id });

    if (sos.unitsFulfilled >= sos.unitsRequired) {
      sos.status = "fulfilled";
    }

    donor.lastDonationDate = new Date();
    await donor.save();

    await sos.save();

    io.emit("sos_updated", sos);
    if (sos.status === "fulfilled") {
      io.emit("sos_fulfilled", sos._id);
    }

    res.status(200).json({
      success: true,
      status: sos.status,
      unitsFulfilled: sos.unitsFulfilled,
      unitsRequired: sos.unitsRequired,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 🏥 Hospital dashboard SOS list
 */
exports.getHospitalSOS = async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({ message: "Access denied" });
    }

    const hospital = await Hospital.findOne({ user: req.user.id });

    const sosList = await SOSRequest.find({
      hospitalId: hospital._id,
    })
      .populate("donorsResponded.donorId", "name phone bloodGroup")
      .sort({ createdAt: -1 });

    res.status(200).json(sosList);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch hospital SOS",
      error: error.message,
    });
  }
};
