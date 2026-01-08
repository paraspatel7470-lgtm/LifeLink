const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ====================== SIGNUP ======================
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, phone, bloodGroup } = req.body;

    // Basic validation
    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // bloodGroup is REQUIRED only for donor
    if (role === "donor" && !bloodGroup) {
      return res.status(400).json({ message: "Blood group is required for donor" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object safely
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      phone
    };

    if (role === "donor") {
      userData.bloodGroup = bloodGroup;
    }

    const newUser = await User.create(userData);

    return res.status(201).json({
      message: "Signup successful",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

// ====================== LOGIN ======================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Dashboard by role
    let dashboard = "";
    if (user.role === "donor") dashboard = "/dashboards/donor/index.html";
    if (user.role === "hospital") dashboard = "/dashboards/hospital/index.html";
    if (user.role === "bloodbank") dashboard = "/dashboards/bloodBank/index.html";

    return res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
      dashboard,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};
