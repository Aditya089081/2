// service/auth.js
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import crypto from 'crypto';
import { db } from "../config/dbClient.js";
import { findSessionById, insertVarificationToken } from "../model/modelController.js";
import { getUserById } from "../model/user.js";
import { sendEmail } from "../lib/resend.js";
import mjml2html from "mjml";
import fs from 'fs/promises';
import path from 'path';
import ejs from 'ejs';

// export const generateToken = ({ id, name, email }) => {
//   return jwt.sign({ id, name, email }, env.JWT_SECRET, {
//     expiresIn: "30d",
//   });
// };

export const verifyJWTToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};
export const createAccessToken = async({id,name,email,sessionId})=>{
  return jwt.sign({ id, name, email ,sessionId}, env.JWT_SECRET, {
    expiresIn: "15m",
  });
}
export const createRefreshToken = async(sessionId)=>{
  return jwt.sign({sessionId}, env.JWT_SECRET, {
    expiresIn: "1w",
  });
}
export const createSession = async (user_id,{ip,user_agent}) => {
  const [result] = await db.execute(
    `INSERT INTO session (user_id, user_agent, ip) VALUES (?, ?, ?)`,
    [user_id, user_agent, ip]
  );
  return result.insertId; // session ID
};
export const RefreshLoginToken = async(refreshToken)=>{
  try{
    const decodedToken = verifyJWTToken(refreshToken);
    const currentSession = await findSessionById(decodedToken.sessionId);
    if(!currentSession || !currentSession.valid){
      throw new Error("Invalid Session");
    }
    const user = await getUserById(currentSession.user_id);
    if(!user){
      throw new Error("Invalid Session");
    }
    const userInfo = {
      id:user.id,
      name:user.name,
      email:user.email,
      sessionId:currentSession.id,
    }
    const newAccessToken = await createAccessToken(userInfo);
    const newRefreshToken = await createRefreshToken(currentSession.id);
    
  return {newAccessToken,newRefreshToken,user:userInfo};

    
  }catch(error){
    console.error(error.message);
  }
}

export const authenticateUser = async({req,res,id,name,email})=>{
  const sessionId = await createSession(id,{ip:req.clientIp,
        user_agent: req.headers["user-agent"],
      });
  
    
    const accessToken = await createAccessToken({
      id:id,
      name:name,
      email:email,
      sessionId:sessionId,
    })
    const refreshToken = await createRefreshToken(sessionId);
  
    res.cookie("accessToken", accessToken, { 
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes in ms
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week in ms
  });
}

export const generateRandomToken =(digit = 8)=>{
  const min = 10**(digit-1);
  const max = 10**(digit);
  return crypto.randomInt(min,max).toString();
}
export const createVerifyLink = async({email,token})=>{
  // manual way aa ho eee --
  // const uriEncodedEmail = encodeURIComponent(email);
  // return `${process.env.FRONTEND_URL}/verify-email-token?token=${token}&email=${uriEncodedEmail}`;

  // URL API way -----
  const url = new URL(`${process.env.FRONTEND_URL}/verify-email-token`);
  url.searchParams.append("token",token);
  url.searchParams.append("email",email);
  return url.toString();

}

// export const findVerificationEmailToken = async({token,email})=>{
//   const [tokenData] = await db.execute(
//     "SELECT user_id, token, expires_at FROM verify_email WHERE token = ? AND expires_at > CURRENT_TIMESTAMP",[token]
//   );
//   if(!tokenData.length){
//     return null;
//   }
//   const {user_id} = tokenData[0];
//   const [userData] = await db.execute(
//     "SELECT id,email FROM users WHERE id = ? AND email = ?",[user_id,email]
//   );
//   return {
//     user_id:userData[0].id,
//     email:userData[0].email,
//     token:tokenData[0].token,
//     expires_at:tokenData[0].expires_at,
//   }
// }
// With joins --->
export const findVerificationEmailToken = async ({ token, email }) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.id AS user_id, u.email, v.token, v.expires_at
       FROM verify_email v
       INNER JOIN users u ON v.user_id = u.id
       WHERE v.token = ? 
         AND u.email = ? 
         AND v.expires_at > CURRENT_TIMESTAMP`,
      [token, email]
    );

    if (!rows.length) {
      return null;
    }

    return rows[0]; 
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const verifyEmailFirst = async({user_id,email})=>{
  const randomToken = generateRandomToken();
      console.log("token : ",randomToken);
      await insertVarificationToken(user_id,randomToken);
  
      const verifyEmailLink = await createVerifyLink({email,token:randomToken});
      console.log("Verify link: ",verifyEmailLink);
      const mjmlTemplate = await fs.readFile(
        path.join(import.meta.dirname,"..","email","verify-email.mjml"),"utf-8"
      )
      // console.log("mjml: ",mjmlTemplate);
      const filledTemplate = ejs.render(mjmlTemplate,{
        token:randomToken,
        link:verifyEmailLink,
        email:email,
      });

      // kara mjml to html
      const htmlOutput = mjml2html(filledTemplate).html;

      sendEmail({
          to:email,
          subject:"Verify your email",
          html:htmlOutput,
      }).catch(console.error);
}
export const createResetPasswordLink= async({user_id})=>{
  const randomToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(randomToken).digest("hex")
  await db.execute(
    "DELETE from password_reset_token where user_id = ?",[user_id]
  )
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  console.log(user_id,"    ",tokenHash,"    ",expiresAt);
  await db.execute(
    "INSERT INTO password_reset_token (user_id,token_hash,expires_at) VALUES (?, ?, ?)",[user_id,tokenHash,expiresAt]
  )
  return `${process.env.FRONTEND_URL}/forgot-password/${randomToken}`;
}
export const getHtmlFromMjmlTemplate = async(template,data)=>{
   const mjmlTemplate = await fs.readFile(
        path.join(import.meta.dirname,"..","email","forgot-password.mjml"),"utf-8"
      )
      // console.log("mjml: ",mjmlTemplate);
      const filledTemplate = ejs.render(mjmlTemplate,data);

      
      const htmlOutput = mjml2html(filledTemplate).html;

      sendEmail({
          to:data.email,
          subject:"reset Your password",
          html:htmlOutput,
      }).catch(console.error);
}