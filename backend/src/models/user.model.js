import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [160, 'Bio cannot exceed 160 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        trim: true,
        minlength: [10, 'Mobile number must be 10 digits'],
        maxlength: [10, 'Mobile number must be 10 digits'],
        match: [/^\d{10}$/, 'Mobile number must be 10 digits']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    avatar: {
        type: String, // Cloudinary URL
        default: ''
    },
    role: {
        type: String,
        enum: ['student', 'alumni'],
        default: 'student'
    },
    college: {
        type: String,
        trim: true,
    },
    branch: {
        type: String,
        trim: true,
    },
    startYear: {
        type: Number,
        select: false
    },
    endYear: {
        type: Number,
        select: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    booksSold: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            select: false
        }
    ],
    booksBought: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            select: false
        }
    ],
    booksPosted: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            select: false
        }
    ],
    refreshToken: {
        type: String,
        select: false,
    },
    isOnBoarded: {
        type: Boolean,
        default: false,
    },


}, { timestamps: true });

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return

    this.password = await bcrypt.hash(this.password, 10)
   
})


userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccesToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_EXPIRES
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRES
        }
    )
}

export const User = mongoose.model("User", userSchema);