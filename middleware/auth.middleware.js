//firstly we check that user is login or not and for this we extract token form req.cookie if token is available its mean user is logged in

import User from "../models/userSchema.js";
import AppError from "../utils/error.utils.js";
import jwt from "jsonwebtoken";

const isLoggedIn = async (req, res, next) => {
  const { token } = req.cookies; //here we can fetch token bcz of using cookie parser
  if (!token) {
    return next(new AppError("Unauthenticated,Please login again.", 401));
  }

  const userDetails = await jwt.verify(token, process.env.JWT_SECRET); //if token is available then we'll get details from jwt.verify
  console.log(userDetails);
  req.user = userDetails;
  next();
};

//for authorization that this is user or admin
const authorizedRole =
  (...roles) =>
  async (req, res, next) => {
    const currentRole = await req.user.role; //here we can get error from jwt token we difined
    if (!roles.includes(currentRole)) {
      return next(
        new AppError("you do not have access to view this route."),
        403
      );
    }
    next();
  };

//for checking that user is autherized subscriber or not

const authorizeSubscriber = async (req, res, next) => {
   const user = await User.findById(req.user.id)
   console.log(user)
  if (user.role !== "ADMIN" && user.subscription.status !== "active") {
    next(new AppError("please subscribe to fetch this route", 403));
  }
  next();
};

export { isLoggedIn, authorizedRole, authorizeSubscriber };
