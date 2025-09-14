import express from 'express';
import path from 'path';
import { editProfile, postResetPassword, getResetPassword, updateUserProfile, getForgotPassword, postForgotPassword, getForgotGmailLink ,postForgotGmailLink, getSetPassword, postSetPassword} from '../controller/profile.js';
import multer from 'multer';
const router = express.Router();
router.route("/profile/edit").get(editProfile);
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/avatar");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`);
    },
});


const avatarFileFilter = (req,file,cb)=>{
    if(file.mimetype.startsWith("image/")){
        cb(null,true);
    }else{
        cb(new Error("Only image file are allowed"),false);
    }
};
const avatarUpload = multer({
    storage:avatarStorage,
    fileFilter:avatarFileFilter,
    limits:{
        fileSize:5*1024*1024
    },
})

router.route("/profile/update-user").post(avatarUpload.single("avatar"),updateUserProfile);
router.route("/profile/reset-password").get(getResetPassword).post(postResetPassword);
router.route("/forgot-password").get(getForgotPassword).post(postForgotPassword);
router.route("/forgot-password/:token").get(getForgotGmailLink).post(postForgotGmailLink);
router.route("/profile/set-password").get(getSetPassword).post(postSetPassword);


export default router;