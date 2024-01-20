import {v2} from "cloudinary";
import app from "./app.js";
import connectionToDb from "./config/db.js";
import cloudinary from "cloudinary";
import Razorpay from "razorpay"

//cloudinary configuration

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//making razorpay instance and configuration

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const PORT = process.env.PORT || "http://localhost:5040";

app.listen(PORT, async () => {
  await connectionToDb();
  console.log(`this server is listning on http://localhost:${PORT}`);
});
