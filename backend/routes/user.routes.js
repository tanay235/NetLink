import e, { Router } from "express";
import { getUserAndProfile, register,uploadProfilePicture } from "../controllers/user.controller.js";
import { login } from "../controllers/user.controller.js";
import multer from "multer";
import { updateUserProfile } from "../controllers/user.controller.js";
import { get } from "mongoose";


const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

const upload = multer({ storage: storage });

router.route("/update_profile_picture")
    .post(upload.single('profile_picture'),uploadProfilePicture);


router.route('/register').post(register);
router.route('/login').post(login);
router.route("/user_update").post(updateUserProfile);
router.route("/get_user_and_profile")
    .get(getUserAndProfile)
    .post(getUserAndProfile);




export default router; 
