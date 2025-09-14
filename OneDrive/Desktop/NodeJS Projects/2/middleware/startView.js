import { verifyJWTToken, RefreshLoginToken } from "../service/auth.js";
import { getUserById } from "../model/user.js";

export const setUserForViews = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  res.locals.user = null;

  if (accessToken) {
    try {
      const decoded = verifyJWTToken(accessToken);
      const user = await getUserById(decoded.id);
      if (user) res.locals.user = user;
      return next();
    } catch (err) {
      
    }
  }

  if (refreshToken) {
    try {
      const { newAccessToken, newRefreshToken, user } = await RefreshLoginToken(refreshToken);
      if (newAccessToken && newRefreshToken) {
        res.locals.user = user;
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          maxAge: 15 * 60 * 1000,
        });
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }
    } catch (err) {
      console.log("Refresh failed", err.message);
    }
  }

  next();
};
