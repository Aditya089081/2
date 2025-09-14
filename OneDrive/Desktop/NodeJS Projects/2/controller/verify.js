import { sendEmail } from "../lib/nodemailer.js";
import { clearVerifyEmailToken, insertVarificationToken, verifyEmailAndUpdate } from "../model/modelController.js";
import { getUserById } from "../model/user.js";
import { createVerifyLink, findVerificationEmailToken, generateRandomToken, verifyEmailFirst } from "../service/auth.js";
import { verifyEmailSchema } from "../Validate/verifyValidate.js";

export const getVerifyEmail = async(req,res)=>{
    if(!req.user) return res.redirect("/login");

    const user = await getUserById(req.user.id);

    if(!req.user || user.us_email_valid) return res.redirect("/");

    return res.render("emailVerify",{user});
}
export const sendVaridicationLink = async(req,res)=>{
    if(!req.user) return res.redirect("/login");

    const user = await getUserById(req.user.id);

    if(!req.user || user.is_email_valid) return res.redirect("/");
    await verifyEmailFirst({email:req.user.email,user_id:req.user.id});
    res.redirect("/profile/verify/email");

}

export const verifyCode = async(req,res)=>{
    console.log(req.query);
    const {data,error} = verifyEmailSchema.safeParse(req.query);
    if(error){
        return res.send("Verification link i dont know.");
    }
    const token = await findVerificationEmailToken(data);
    if(!token) res.send("verification link invalid or expired.");

    await verifyEmailAndUpdate(token.email);
    clearVerifyEmailToken(token.email).catch(console.error);
    return res.redirect("/");
}