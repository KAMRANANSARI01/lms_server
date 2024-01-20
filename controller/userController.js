import { json } from "express";
import User from "../models/userSchema.js";
import AppError from "../utils/error.utils.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.utils.js";

//common cookieOptions
const cookieOption = {
  maxAge: 24 * 60 * 60 * 1000,
  // httpOnly:true,
  // secure:true
};

//***********for user registration***************//
const register = async (req, res, next) => {
  console.log(req.body);
  const { fullName, email, password } = req.body;

  //adding some validations
  if (!fullName || !email || !password) {
    return next(new AppError("All fields are required", 400));
  }
  //checking that user is already exist or not
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError("Email already exists", 400));
  }

  const user = await User.create({
    fullName,
    email,
    password,
    avatar: {
      public_id: email,
      secure_url:
        "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.pngegg.com%2Fen%2Fsearch%3Fq%3Davatars&psig=AOvVaw1Ep2HrPQJQBpISDmhIq5_Y&ust=1698941282388000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCMi5xM-Xo4IDFQAAAAAdAAAAABAE",
    },
  });

  if (!user) {
    return next(
      new AppError("user registration failed, please try again"),
      400
    );
  }

  //File uploading

  //here we get the converted profile pic file in req.file then we will save it into cloudinary.
  console.log("FILE DETAILS >", JSON.stringify(req.file));

  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        height: 250,
        width: 250,
        gravity: "faces",
        crop: "fill",
      });
      if (result) {
        (user.avatar.public_id = result.public_id),
          (user.avatar.secure_url = result.secure_url);

        //remove file from server(uploads folder)
        fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (error) {
      return next(new AppError(error.message, 503));
    }
  }

  await user.save();

  //when user registered successfully after that we want to save their info in cookie sothat after register user logged in automatically.
  const token = await user.generateJWTToken(); //this function defined in userschema.js
  //after password encription we do not want to share
  user.password = undefined;
  res.cookie("token", token, cookieOption);

  res.status(201).json({
    success: true,
    message: "user registered successfully",
    user,
  });
};

//**************for login**************//
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //adding some validations
    if (!email || !password) {
      return next(new AppError("All fields are required", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.comparePassword(password)) {
      return next(new AppError("email or password does not match.", 400));
    }
    const token = await user.generateJWTToken(); //this function defined in userschema.js
    //after password encription we do not want to share
    user.password = undefined;
    res.cookie("token", token, cookieOption);

    res.status(201).json({
      success: true,
      message: "user loggedin successfully",
      user,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

//***************for logout************//
const logout = async (req, res, next) => {
  try {
    await res.cookie("token", null, {
      secure: true,
      httpOnly: true,
      maxAge: 0,
    });

    res.status(200).json({
      success: true,
      message: "User loggedout successfully",
    });
  } catch (error) {
    console.log(error);
    return next(new AppError(error.message, 400));
  }
};

//*************for getProfile**********//
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      message: "fetched user's data",
      user,
    });
  } catch (error) {
    return next(new AppError("failed to fetch user profile", 500));
  }
};

//***************forgot password*********//

const forgotPassword = async function (req, res, next) {
  try {
    const { email } = req.body;
    console.log(email);
    if (!email) {
      return next(new AppError("email is required", 400));
    }

    //checking that email is exist in db or not

    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError("Email is not registered", 403));
    }
    //here we are makin reset url for sending it to the email and generatePasswordResetToken function is defined in userschema

    const resetToken = await user.generatePasswordResetToken();

    await user.save(); //saving token in database

    const resetPassswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    //here we are defining subject and msg that send to the user for resting the password.
    const subject = "Reset Password";
    const message = `You can reset your password by clicking <a href = ${resetPassswordUrl} target="_blank">Reset your password</a>.\n if the above link does not work for some reason then copy paste this link in new tab ${resetPassswordUrl}.\n If you have not requested this, kindly ignore.`;
    console.log(resetPassswordUrl);

    try {
      await sendEmail(email, subject, message);
      res.status(200).json({
        success: true,
        message: `Reset password token has been sent to the ${email} successfully`,
      });
    } catch (error) {
      user.forgotPasswordExpiry = undefined;
      user.forgotPasswordToken = undefined;
      await user.save();
      return next(new AppError(error.message, 403));
    }
  } catch (error) {
    console.log(error);
    return next(new AppError(error.message, 400));
  }
};

//*************Reset password****************//
const resetPassword = async function (req, res, next) {
  const { resetToken } = req.params; //resettoken got from url
  const { password } = req.body; // new password is filled

  const forgotPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken,
    forgotPasswordExpiry: { $gt: Date.now() }, //token that is not expire
  });

  if (!user) {
    return next(new AppError("Token is expired , please try again ", 400));
  }

  //if we got the user then
  user.password = password; //user.password me new password update
  //after update password
  user.forgotPasswordToken = undefined;
  user.forgotPasswordToken = undefined;
  user.save(); //new password save into database

  res.status(200).json({
    success: true,
    message: "Password changed successfully.",
  });
};

//********change Password****************//
const changePassword = async function (req, res, next) {
  const { oldPassword, newPassword } = req.body; //old password is already saved in db
  const { id } = req.user; //it is defined in authMiddleware.js

  if (!oldPassword || !newPassword) {
    return next(new AppError("All feilds are required.", 400));
  }

  //here we get the id from db and then fetch old password from db

  const user = await User.findById(id).select("+password");
  // if we are unable to get user then
  if (!user) {
    return next(new AppError("user does not exist", 400));
  }

  //in case if user exist then we compare the old password that is filled by the user in req.body to the user's password that is saved in db
  const isPasswordValid = await user.comparePassword(oldPassword); //comparePassword id defined in userSchema
  //old password is not valid then
  if (!isPasswordValid) {
    return next(new AppError("Invalid old password", 400));
  }
  //if old password is valid then we exchange the old passwords with newpassword and then save it into db
  user.password = newPassword;

  await user.save();
  //after changing the new password
  user.password = undefined; //so that noOne can access

  res.status(200).json({
    success: true,
    message: "Password  changed successfully",
  });
};

//*************update profile**************//
const updateProfile = async function (req, res, next) {
  //here we are changing fullName and the profilePic
  const { fullName } = req.body;
  const { id } = req.params;

  //now we check the user is exist in db or not

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("user does not exist", 400));
  }
  //if user exist then we update the new fullName

  if (req.fullName) {
    user.fullName = fullName;
  }
  //now we delete the previous profile pic that is uploaded in cloudinary
  if (req.file) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  }

  //after deleting then new profile pic update
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        height: 250,
        width: 250,
        gravity: "faces",
        crop: "fill",
      });
      if (result) {
        (user.avatar.public_id = result.public_id),
          (user.avatar.secure_url = result.secure_url);

        //remove file from server(uploads folder)
        fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (error) {
      return next(new AppError(error.message, 503));
    }
  }

  //now save it into db
  await user.save();
  res.status(200).json({
    success: true,
    message: "User profile updated successfully",
  });
};
export {
  register,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
};
