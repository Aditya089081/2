
import argon2 from "argon2";
import { createAccessToken, createRefreshToken, createSession, verifyEmailFirst} from "../service/auth.js";
import { getUserByEmail, createUser } from "../model/user.js";
import { LoginUserSchema, registerUserSchema } from "../Validate/authValidate.js";

export const handleUserSignUp = async (req, res) => {
      const { name, email, password } = req.body;
      if(!password) {
          req.flash("errors","You have created account using social login");
          return res.redirect("/login");
      }

      // HiYA ZOD VALIDATION KARAT AAHI
      const {data,error} = registerUserSchema.safeParse(req.body);
      console.log(data);
      if(error){
        const errors = error.issues&&error.issues.length>0?error.issues[0].message:"Invalid Input";
        req.flash("errors",errors);
        return res.redirect("/register");
  }
  try {
          const existing = await getUserByEmail(email);
          if (existing) {
            req.flash("errors", "User already exists");
            return res.redirect("/register");
          }

          const hashedPassword = await argon2.hash(password);
          const insertId = await createUser({ name, email, password: hashedPassword });


          if (!insertId) {
            req.flash("errors", "Failed to register user");
            return res.redirect("/register");
          }
          const sessionId = await createSession(insertId,{ip:req.clientIp,
            user_agent: req.headers["user-agent"],
          });

        
        const accessToken = await createAccessToken({
          id:insertId,
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
    await verifyEmailFirst({email,user_id:insertId});
    res.redirect("/profile/verify/email");
    
  } catch (err) {
    console.error("Signup error:", err);
    req.flash("errors", "Server error");
    res.redirect("/register");
  }
};


export const handleUserLogin = async (req, res) => {
  
  // Yaha zod validattion karat ahee , SafeParse kai Use Kai Ke
  const parsed = LoginUserSchema.safeParse(req.body);
if (!parsed.success) {
  const errors = parsed.error.issues?.[0]?.message || "Invalid Input";
  req.flash("errors", errors);
  return res.redirect("/login");
}
const { email, password } = parsed.data;
      if(!password) {
          req.flash("errors","Login is Invalid, Please login with Social media");
          return res.redirect("/login");
      }
  
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      req.flash("errors", "Invalid credentials");
      return res.redirect("/login");
    }
    res.locals.user = user;
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      req.flash("errors", "Invalid credentials");
      return res.redirect("/login");
    }

    // const token = generateToken({
    //   id: user.id,
    //   name: user.name,
    //   email: user.email,
    // });

    // res.cookie("access token", token, { httpOnly: true });
    const sessionId = await createSession(user.id,{ip:req.clientIp,
      user_agent: req.headers["user-agent"],
    });

  
  
  const accessToken = await createAccessToken({
    id:user.id,
    name:user.name,
    email:user.email,
    sessionId:sessionId,
  })
  const refreshToken = await createRefreshToken(sessionId);

  res.cookie("accessToken", accessToken, { 
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  maxAge: 15 * 60 * 1000,
});
res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});


    res.redirect("/");
  } catch (err) {
    console.error("Login error:", err);
    req.flash("errors", "Server error");
    res.redirect("/login");
  }
};
