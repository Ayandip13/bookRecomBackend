import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

// const response = await fetch(`https://localhost:3000/api/books`, {
//   method: "POST",
//   body: JSON.stringify({
//     title,
//     caption,
//   }),
//   headers: { Authorization: `Bearer ${token}` },
// });

const protectRoute = async (req, res, next) => {
  try {

    //get token
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token)
      return res
        .status(401)
        .json({ message: "No authorization token, access denied" });

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  //If valid, it decodes the token and extracts the payload (e.g., userId).

    //find user

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(401).json({ message: "Token is not valid" });

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
  }
};

export default protectRoute;
