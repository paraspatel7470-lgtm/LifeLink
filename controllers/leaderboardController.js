const User = require("../models/user");
const Donor = require("../models/Donor");


exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find(
      { role: "donor" },
      "name donationsCount"
    )
      .sort({ donationsCount: -1 })
      .limit(5)
      .lean();

    const userIds = users.map(u => u._id);

    const donors = await Donor.find(
      { user: { $in: userIds } },
      "user bloodGroup"
    ).lean();

    const bloodMap = {};
    donors.forEach(d => {
      bloodMap[d.user.toString()] = d.bloodGroup;
    });

    const leaderboard = users.map(u => ({
      ...u,
      bloodGroup: bloodMap[u._id.toString()] || "-"
    }));

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ message: "Leaderboard error" });
  }
};

