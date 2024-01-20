import { Router } from "express";
import { contactUs, userStats } from "../controller/miscellenious.controller.js";
import { authorizedRole, isLoggedIn } from "../middleware/auth.middleware.js";


const router = Router();

router.route('/contact').post(contactUs);
router
  .route('/admin/stats/users')
  .get(isLoggedIn, authorizedRole('ADMIN'), userStats);


export default router;