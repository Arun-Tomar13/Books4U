import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"

const otpSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    identifier: {
      type: String, // email or phone
      required: true
    },

    otp: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ["email", "phone"],
      required: true
    },

    purpose: {
      type: String,
      enum: ["register", "reset-password", "login"],
      required: true
    },

    expiresAt: {
      type: Date,
      required: true
    },

    isUsed: {
      type: Boolean,
      default: false,
    }

  },
  { timestamps: true }
);

otpSchema.pre("save", async function () {
    if (!this.isModified("otp")) return

    this.otp = await bcrypt.hash(this.otp, 10)
   
})


otpSchema.methods.isOtpCorrect = async function (otp) {
    return await bcrypt.compare(otp, this.otp);
}

// Auto delete expired OTP records (Optional but recommended)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model("Otp", otpSchema);
