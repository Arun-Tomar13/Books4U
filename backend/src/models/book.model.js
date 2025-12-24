import mongoose, { Schema } from "mongoose";

const BookSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [150, "Title cannot exceed 150 characters"],
  },

  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, "Author name cannot exceed 100 characters"],
  },

  publication: {
    type: String,
    trim: true,
    maxlength: [100, "Publication name cannot exceed 100 characters"],
  },

  edition: {
    type: String, // keep string: "3rd", "2022", etc.
    trim: true,
    maxlength: [50, "Edition cannot exceed 50 characters"],
  },

  branch: {
    type: String,
    required: true,
    trim: true, // e.g., "CSE", "Mechanical"
  },

  semester: {
    type: Number,
    min: 1,
    max: 8,
  },

  subject: {
    type: String,
    trim: true, // e.g., "Data Structures", "Thermodynamics"
    maxlength: [100, "Subject cannot exceed 100 characters"],
  },

  condition: {
    type: String,
    enum: ["new", "like-new", "good", "used", "old-but-usable"],
    default: "good",
    required: true,
  },

  // Price-related
  mrp: {
    type: Number,
    min: 0,
  },

  price: {
    type: Number,
    min: 0,
    required: true, // for donation, you can enforce 0 in controller
  },

  type: {
    type: String,
    enum: ["sale", "donation"],
    default: "sale",
    required: true,
  },

  status: {
    type: String,
    enum: ["available", "sold"],
    default: "available",
    index: true,
  },

  // Extra info for buyer
  description: {
    type: String,
    trim: true,
    maxlength: [300, "Description cannot exceed 300 characters"],
  },

  // Photos (Cloudinary URLs)
  images: [
    {
      type: String,
      trim: true,
    }
  ],

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

}, { timestamps: true });

// For search: by title/author/subject
BookSchema.index({ title: "text", author: "text", subject: "text" });

export const Book = mongoose.model("Book", BookSchema);
