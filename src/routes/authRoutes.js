import express from "express";
import User from "../models/User.model.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password should be at least 6 characters long" });
    }

    if (username.length < 4) {
      return res
        .status(400)
        .json({ message: "Username should be at least 4 character long" });
    }

    //check if user already exist or not

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email is already exists" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    // get random avatar
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    const user = new User({
      email,
      username,
      password,
      profileImage,
    });

    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      token, //The JWT token allows the user to stay authenticated.
      user: {
        //The user object contains all the saved user details.
        id: user._id,
        username: user.username, //here we didn't send the password to the user
        email: user.email,
        profileImage: user.profileImage,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.log("Error in register route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    //check if user exists

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "user doesn't exists" });

    // check if password is correct.. so here we're sending the password to the method that is comparing the password that is given by user and hashed password(from DB)
    const isPassowrdCorrect = await user.comparePassword(password);
    if (!isPassowrdCorrect)
      return res.status(400).json({ message: "Invalid credentials" });

    //generate token
    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.log("Error in login route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
