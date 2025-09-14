import { clearResetPasswordToken, deleteToken, getIdByToken, setUserPassword, UpdatePassword, updateUser } from "../model/profile.js";
import { getUserByEmail, getUserById } from "../model/user.js";
import { forgotPasswordSchema, resetPasswordSchema } from "../Validate/authValidate.js";
import { updateUserSchema } from "../Validate/updateValidate.js";
import argon2 from 'argon2';
import crypto from 'crypto';
import { forgotUserSchema } from "../Validate/verifyValidate.js";
import { createResetPasswordLink, getHtmlFromMjmlTemplate } from "../service/auth.js";

export const editProfile = async(req,res)=>{
    if(!req.user){
        return res.redirect("/");
    }
    const user = await getUserById(req.user.id);
    return res.render("edit-user", {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar ? `/${user.avatar}` : null,
    errors: req.flash("errors"),
});

}
export const updateUserProfile = async(req,res)=>{
    const {data,error} = updateUserSchema.safeParse(req.body);
    // if(error){
    //       const errorMessage = error.issues.map(issue => issue.message);
    //     req.flash("errors",errorMessage);
    //     return res.redirect("/edit -user")
    // }
    const {name,email} = req.body;
    
    const fileUrl = req.file?`avatar/${req.file.filename}`:undefined;
    await updateUser({name,email,avatarUrl:fileUrl});
    return res.redirect("/profile");
}
export const getResetPassword = (req,res)=>{
    res.render("reset-password",{errors:req.flash("errors")});
}
export const postResetPassword = async(req,res)=>{
    if(!req.user) return res.redirect("/login");

    const result= resetPasswordSchema.safeParse(req.body);
    if(!result.success){
    const errorMessage = result.error.issues.map(issue => issue.message);
    req.flash("errors", errorMessage);
    return res.redirect("/profile/reset-password");
    }

    console.log(result.data);
    const {currentPassword,newPassword} = result.data;

    const user = await getUserById(req.user.id);

    const isValid = await argon2.verify(user.password,currentPassword);
    if(!isValid){
        req.flash("error",["Your current password is incorrect."])
        return res.redirect("/profile/reset-password");
    }
    const hashPassword = await argon2.hash(newPassword);

    await UpdatePassword(user.id,hashPassword);

    console.log("newPassword: ",user.password);
    return res.redirect("/profile");
    
}

export const getForgotPassword = (req,res)=>{
    return res.render("forgot-password",{
        formSubmitted:req.flash("formSubmitted")[0],
        errors:req.flash("errors"),
    })
}
export const postForgotPassword = async(req,res)=>{
    const result = forgotUserSchema.safeParse(req.body);
    if(!result.success){
        req.flash("errors",["Please provide a valid email"]);
        return res.redirect("/forgot-password");
    }

    const user = await getUserByEmail(result.data.email);
    console.log(result.data.email);
    console.log(user);
    if(user){
        const resetLink = await createResetPasswordLink({ user_id: user.id });
        console.log("resetLink: ", resetLink);

        await getHtmlFromMjmlTemplate("forgot-password", {
            name: user.name,
            email: user.email,
            resetLink
        });
    }

    req.flash("formSubmitted", ["submitted"]);
    return res.redirect("/forgot-password");
}

export const getForgotGmailLink = async(req,res)=>{
    const {token} = req.params;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
    const user_id = await getIdByToken(tokenHash);
    console.log("user_id: ",user_id);
    if(user_id){
        return res.render("forgot", { user_id,token, errors: req.flash("errors") });

    }
    req.flash("errors",["Link has been expired or invalid"]);
    return res.redirect("/login");
}
export const postForgotGmailLink = async(req,res)=>{
    const result = forgotPasswordSchema.safeParse(req.body);
      if (!result.success) {
    const errorMessage = result.error.issues.map(issue => issue.message);
    req.flash("errors", errorMessage);
    return res.redirect(`/forgot-password/${req.params.token}`);
  }

    const {token} = req.params;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
    const user_id = await getIdByToken(tokenHash);
    if(!user_id){
        req.flash("errors",["Link has been expired or invalid"]);
        return res.redirect("/login");
    }
    const { newPassword } = result.data;
console.log("New Password: ", newPassword);

await clearResetPasswordToken();
const hashPassword = await argon2.hash(newPassword);
await deleteToken(tokenHash);
await setUserPassword(user_id, hashPassword);
return res.redirect("/login");
}

export const getSetPassword = async(req,res)=>{
    if(!req.user) return res.redirect("/login");
    return res.render("set-password",{errors:req.flash("errors")});
}
export const postSetPassword = async(req,res)=>{
    if(!req.user) return res.redirect("/login");

    const result= forgotPasswordSchema.safeParse(req.body);
    if(!result.success){
    const errorMessage = result.error.issues.map(issue => issue.message);
    req.flash("errors", errorMessage);
    return res.redirect("/profile/set-password");
    }

    console.log(result.data);
    const {newPassword} = result.data;

    const user = await getUserById(req.user.id);
    if(!user.password){
        const hashPassword = await argon2.hash(newPassword);
        await UpdatePassword(user.id,hashPassword);
        console.log("newPassword: ",user.password);
        return res.redirect("/profile");
    }
    else{
        req.flash("errors", ["Sorry, You cannot set the Password"]);
    return res.redirect("/login");
    }


}