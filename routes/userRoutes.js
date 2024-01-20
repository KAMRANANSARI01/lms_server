import  {Router}  from "express";
import {register,getProfile,login, logout, forgotPassword, resetPassword, changePassword, updateProfile} from "../controller/userController.js"
import { isLoggedIn } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
const router =Router()

router.post("/register",upload.single("avatar"), register)
router.post("/login",login)
router.get("/logout",logout)
router.get("/me",isLoggedIn,getProfile)
router.post("/reset",forgotPassword)
router.post("/reset/:resetToken",resetPassword)
router.post('/changePassword',isLoggedIn,changePassword)
router.put("/update/:id" ,isLoggedIn , upload.single("avatar") ,updateProfile)
export default router;