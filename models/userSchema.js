import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
  {
    fullName: {
      type: "String",
      maxLength: [20, "name must be less than 20 char."],
      required: [true, "name is required"],
      minLength: [4, "name must be greater than 4 char."],
      trim: true,
      lowercase: true,
    },
    email: {
      type: "String",
      required: [true, "email is required"],
      trim: true,
      lowercase: true,
      match: [/[^\s@]+@[^\s@]+\.[^\s@]+/, "please enter a valid email"],
    },
    password: {
      type: "String",
      required: [true, "password is required"],
      minLength: [6, "password must be contain atleast 6 char."],
      select: false,
    },
    avatar: {
      public_id: {
        type: "String",
      },
      secure_url: {
        type: "String",
      },
    },
    //here are making this schema for role as a student or a admin
    role: {
      type: "String",
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    subscription: {
      id: String,
      status: String,
    },
  },
  {
    timestamps: true,
  }
);
//for password encription before saving in db.
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

//for generation token
userSchema.methods = {
  generateJWTToken: async function () {
    return await JWT.sign(
      {
        id: this._id,
        email: this.email,
        subscription: this.subscription,
        role: this.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );
  },
  comparePassword: async function (plainTextPassword) {
    return await bcrypt.compare(plainTextPassword, this.password);
  },
  generatePasswordResetToken: async function () {
    const resetToken = crypto.randomBytes(20).toString("hex");//it will send to the url's query params

    this.forgotPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes form now

    return resetToken;
  },
};

const 
User = model("User", userSchema);
export default User;
