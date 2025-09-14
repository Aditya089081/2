import { getUserById } from "../model/user.js";
import { RefreshLoginToken, verifyJWTToken } from "../service/auth.js";

export const restrictToLoggedInOnly = async (req, res, next) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  if (accessToken) {
    try {
      const decoded = verifyJWTToken(accessToken);
      res.locals.user = decoded;
      req.user = decoded;
      return next();
    } catch (err) {
      console.log("Access token expired or invalid, trying refresh...");
    }
  }

  if (refreshToken) {
    try {
      const { newAccessToken, newRefreshToken, user } = await RefreshLoginToken(refreshToken);
      if (!newAccessToken || !newRefreshToken) throw new Error("Refresh failed");

      res.cookie("accessToken", newAccessToken, { httpOnly: true, maxAge: 15*60*1000 });
      res.cookie("refreshToken", newRefreshToken, { httpOnly: true, maxAge: 7*24*60*60*1000 });

      res.locals.user = user;
      req.user = user;
      return next();
    } catch (err) {
      console.log("Refresh token invalid:", err.message);
    }
  }

  
  res.locals.user = null;
  req.user = null;
  next();
  // const accessToken = req.cookies.accessToken;
  // const refreshToken = req.cookies.refreshToken;
  // req.user = null;
  // res.locals.user = null;
  // if (accessToken) {
  //   try {
  //     const decoded = verifyJWTToken(accessToken);
  //     user = await getUserById(decoded.id);
  //     req.user = user;
  //     req.locals.user = user;
  //     return next();
  //   } catch (err) {
  //     // Token expired/invalid → try refresh token
  //     console.log("Access token expired or invalid, trying refresh...");
  //   }
  // }

  // if (!accessToken && !refreshToken) {
  //   return next();
  // }

  // // 1. Try verifying access token

  // // 2. Try refresh token
  // if (refreshToken && !accessToken) {
  //   try {
  //     const { newAccessToken, newRefreshToken, user } = await RefreshLoginToken(refreshToken);
  //     if (!newAccessToken || !newRefreshToken) {
  //       throw new Error("Failed to refresh tokens");
  //     }

  //     req.user = user;
  //     res.locals.user = user;

  //     res.cookie("accessToken", newAccessToken, {
  //       httpOnly: true,
  //       secure: false,
  //       sameSite: "lax",
  //       maxAge: 15 * 60 * 1000, // 1 min
  //     });
  //     res.cookie("refreshToken", newRefreshToken, {
  //       httpOnly: true,
  //       secure: false,
  //       sameSite: "lax",
  //       maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  //     });
  //     return next();
  //   } catch (err) {
  //     console.error("Refresh token error:", err.message);
  //      res.clearCookie("accessToken");
  //     res.clearCookie("refreshToken");
  //     return res.redirect("/login");
  //   }
  // }

  // // If nothing worked
  // return res.redirect("/login");
};


// import { verifyJWTToken, RefreshLoginToken } from './service/auth.js';

// app.use(async (req, res, next) => {
//   const accessToken = req.cookies?.accessToken;
//   const refreshToken = req.cookies?.refreshToken;

//   if (accessToken) {
//     try {
//       const decoded = verifyJWTToken(accessToken);
//       res.locals.user = decoded;
//       req.user = decoded;
//       return next();
//     } catch (err) {
//       console.log("Access token expired or invalid, trying refresh...");
//     }
//   }

//   if (refreshToken) {
//     try {
//       const { newAccessToken, newRefreshToken, user } = await RefreshLoginToken(refreshToken);
//       if (!newAccessToken || !newRefreshToken) throw new Error("Refresh failed");

//       res.cookie("accessToken", newAccessToken, { httpOnly: true, maxAge: 15*60*1000 });
//       res.cookie("refreshToken", newRefreshToken, { httpOnly: true, maxAge: 7*24*60*60*1000 });

//       res.locals.user = user;
//       req.user = user;
//       return next();
//     } catch (err) {
//       console.log("Refresh token invalid:", err.message);
//     }
//   }

//   // If no valid tokens
//   res.locals.user = null;
//   req.user = null;
//   next();
// });
