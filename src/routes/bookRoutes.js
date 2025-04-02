import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.model.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;
    if (!image || !title || !caption || !rating)
      return res.status(400).json({ message: "Please Provide all fields" });

    //upload them on cloudinary

    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadResponse.secure_url;
    //save to the database

    const newBook = new Book({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id,
    });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    console.log("Error creating book ", error);
    res.status(500).json({ message: error.message });
  }
});

//pagination => infinite loading...

router.get("/", protectRoute, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;

    //Book.find() is a Mongoose query that retrieves all documents from the books collection.
    const books = await Book.find() //this will fetch the multiple books from db, that's why `books` will be an array of multiple objects
      .sort({ createdAt: -1 }) // Sort books by newest first (descending order)
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage"); //Retrieves only the "username" and "profileImage" fields from the user(field from Book schema) collection.

    const totalBooks = await Book.countDocuments();

    res.send({
      books,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Error in get all books route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//get recomemded books by the logged in user
router.get("/user", protectRoute, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(books);
  } catch (error) {
    console.log("get the books error: ", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    //check if user is the creator of the book

    if (book.user.toString() !== req.user._id.toString())
      //`book.user` is the ID who created the book and `req.user._id` is the ID of user who requested this
      return res.status(401).json({ message: "Unauthorized" });

    //delete the book from cloudinary
    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.log("Error deleting Image from cloudinary");
      }
    }

    await book.deleteOne();
    res.json({ message: "Book deleted succesfully" });
  } catch (error) {
    console.log();
  }
});

export default router;
