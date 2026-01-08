const Donor = require("../models/Donor");
const User = require("../models/user");

/**
 * Register or create donor profile (link to existing user)
 * body: { userId, phone, bloodGroup, lat, lng, city, state }
 */
exports.registerDonor = async (req, res) => {
  try {
    const { userId, phone, bloodGroup, lat, lng, city, state } = req.body;

    // check user exists
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found" });

    // prevent duplicate donor profiles
    const existing = await Donor.findOne({ user: userId });
    if (existing) return res.status(400).json({ message: "Donor profile already exists" });

    const donor = await Donor.create({
      user: userId,
      phone: phone || user.phone || "",
      bloodGroup,
      location: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
      city: city || "",
      state: state || "",
      available: true
    });

    return res.status(201).json({ message: "Donor registered", donor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

/**
 * Toggle availability: PATCH /api/donors/:id/availability
 * body: { available: true/false }
 */
exports.toggleAvailability = async (req, res) => {
  try {
    const donorId = req.params.id;
    const { available } = req.body;

    const donor = await Donor.findByIdAndUpdate(
      donorId,
      { available: !!available },
      { new: true }
    );

    if (!donor) return res.status(404).json({ message: "Donor not found" });
    return res.json({ message: "Availability updated", donor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

/**
 * Update donor location: PATCH /api/donors/:id/location
 * body: { lat, lng }
 */
exports.updateLocation = async (req, res) => {
  try {
    const donorId = req.params.id;
    const { lat, lng } = req.body;

    const donor = await Donor.findByIdAndUpdate(
      donorId,
      { location: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] } },
      { new: true }
    );

    if (!donor) return res.status(404).json({ message: "Donor not found" });
    return res.json({ message: "Location updated", donor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

/**
 * SOS - Find nearby donors
 * POST /api/donors/sos
 * body: { lat, lng, bloodGroup, maxDistanceMeters (optional), limit (optional) }
 */
exports.findNearbyDonors = async (req, res) => {
  try {
    const { lat, lng, bloodGroup, maxDistanceMeters = 5000, limit = 10 } = req.body;

    if (!lat || !lng || !bloodGroup) {
      return res.status(400).json({ message: "lat, lng and bloodGroup are required" });
    }

    // $near query - requires 2dsphere index on location
    const donors = await Donor.find({
      bloodGroup,
      available: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistanceMeters, 10)
        }
      }
    })
      .limit(parseInt(limit, 10))
      .select("-__v"); // remove __v

    return res.json({ count: donors.length, donors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "SOS search failed", error: err.message });
  }
};

/**
 * Get donor by id (for profile)
 */
exports.getDonor = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id).populate("user", "name email");
    if (!donor) return res.status(404).json({ message: "Donor not found" });
    return res.json({ donor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
};

/**
 * Mark donation done (increase donation count and update lastDonationDate)
 * PATCH /api/donors/:id/donate
 * body: { date (optional) }
 */
exports.markDonation = async (req, res) => {
  try {
    const donorId = req.params.id;
    const { date } = req.body;

    const donor = await Donor.findById(donorId);
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    donor.donationCount = (donor.donationCount || 0) + 1;
    donor.lastDonationDate = date ? new Date(date) : new Date();
    await donor.save();

    return res.json({ message: "Donation recorded", donor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Mark donation failed", error: err.message });
  }
};
