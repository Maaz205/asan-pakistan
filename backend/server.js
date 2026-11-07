
require("node:dns").setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Ride = require("./models/Ride");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Asan Pakistan Backend is running!",
  });
});

// API health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Asan Pakistan API is working!",
  });
});
app.use(async (req, res, next) => {
  try {
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({
        success: false,
        message: "MONGODB_URI is missing"
      });
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    next();
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Database connection failed"
    });
  }
});
// SIGNUP
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid name, email, and password (8–72 characters).",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered. Please log in.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    console.error("Signup error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create account. Please try again.",
    });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email and password.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again.",
    });
  }
});

// DRIVER SIGNUP
app.post("/api/driver/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      name.trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid name, email and password (8–72 characters).",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const driver = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "driver",
    });

    const token = jwt.sign(
      { userId: driver._id.toString(), role: "driver" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      success: true,
      message: "Driver account created successfully!",
      token,
      user: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        role: driver.role,
      },
    });
  } catch (error) {
    console.error("Driver signup error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create driver account.",
    });
  }
});

// DRIVER LOGIN
app.post("/api/driver/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email and password.",
      });
    }

    const driver = await User.findOne({
      email: email.trim().toLowerCase(),
      role: "driver",
    }).select("+password");

    if (!driver || !(await bcrypt.compare(password, driver.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid driver email or password.",
      });
    }

    const token = jwt.sign(
      { userId: driver._id.toString(), role: "driver" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      success: true,
      message: "Driver login successful!",
      token,
      user: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        role: driver.role,
      },
    });
  } catch (error) {
    console.error("Driver login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to log in as driver.",
    });
  }
});

// CREATE RIDE - LOGIN REQUIRED
app.post("/api/rides", authMiddleware, async (req, res) => {
  try {
    const {
      passengerPhone,
      pickupLocation,
      dropoffLocation,
      rideType,
      fare,
    } = req.body;

    if (
      typeof passengerPhone !== "string" ||
      !passengerPhone.trim() ||
      typeof pickupLocation !== "string" ||
      !pickupLocation.trim() ||
      typeof dropoffLocation !== "string" ||
      !dropoffLocation.trim() ||
      fare === undefined ||
      fare === null ||
      fare === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required booking details.",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please login again.",
      });
    }

    const parsedFare = Number(fare);

    if (!Number.isFinite(parsedFare) || parsedFare < 0) {
      return res.status(400).json({
        success: false,
        message: "Fare must be a valid non-negative number.",
      });
    }

  const newRide = await Ride.create({
  userId: user._id,
  passengerName: user.name,
  passengerPhone: passengerPhone.trim(),
  pickupLocation: pickupLocation.trim(),
  dropoffLocation: dropoffLocation.trim(),
  rideType,
  fare: parsedFare,
});

    return res.status(201).json({
      success: true,
      message: "Ride booked successfully!",
      ride: newRide,
    });
  } catch (error) {
    console.error("Ride booking error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to book ride. Please try again.",
    });
  }
});

// DRIVER - VIEW PENDING RIDE REQUESTS
app.get("/api/driver/rides", authMiddleware, async (req, res) => {
  try {
    const driver = await User.findById(req.user.userId);

    if (!driver || driver.role !== "driver") {
      return res.status(403).json({
        success: false,
        message: "Driver access only.",
      });
    }

    const rides = await Ride.find({
      status: "pending",
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error("Driver rides error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch ride requests.",
    });
  }
});

 // DRIVER - ACCEPT A RIDE
app.patch("/api/driver/rides/:id/accept", authMiddleware, async (req, res) => {
  try {
    const driver = await User.findById(req.user.userId);

    if (!driver || driver.role !== "driver") {
      return res.status(403).json({
        success: false,
        message: "Driver access only.",
      });
    }

    const ride = await Ride.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "pending",
      },
      {
        $set: {
          status: "accepted",
          driverId: driver._id,
          driverName: driver.name,
        },
      },
      { new: true, runValidators: true }
    );

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride is no longer available.",
      });
    }

    return res.json({
      success: true,
      message: "Ride accepted successfully!",
      ride,
    });
  } catch (error) {
    console.error("Accept ride error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to accept ride.",
    });
  }
});

 // DRIVER - VIEW MY ACCEPTED RIDES
app.get("/api/driver/my-rides", authMiddleware, async (req, res) => {
  try {
    const driver = await User.findById(req.user.userId);

    if (!driver || driver.role !== "driver") {
      return res.status(403).json({
        success: false,
        message: "Driver access only.",
      });
    }

    const rides = await Ride.find({
      driverId: driver._id,
      status: { $in: ["accepted", "started", "completed"] },
    }).sort({ updatedAt: -1 });

    return res.json({
      success: true,
      rides,
    });
  } catch (error) {
    console.error("My driver rides error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your rides.",
    });
  }
});

// GET ALL RIDES
// GET LOGGED-IN USER'S RIDES
app.get("/api/rides", authMiddleware, async (req, res) => {
  try {
    const rides = await Ride.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error("Fetch rides error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your rides.",
    });
  }
});

// CANCEL RIDE - LOGIN REQUIRED
app.patch("/api/rides/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found.",
      });
    }

    if (ride.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending rides can be cancelled.",
      });
    }

    ride.status = "cancelled";
    await ride.save();

    return res.json({
      success: true,
      message: "Ride cancelled successfully!",
      ride,
    });
  } catch (error) {
    console.error("Cancel ride error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel ride.",
    });
  }
});

// START SERVER

module.exports = app;

