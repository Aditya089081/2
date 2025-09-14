
import { decodeIdToken, Google, generateCodeVerifier, generateState } from "arctic";
import { createUserWithOAuth, getUserWithOauthId, linkUserWithOauth } from "../model/user.js";
import { google } from "../lib/google.js";
import { createAccessToken, createRefreshToken, createSession } from "../service/auth.js";


export const getGoogleLoginPage = async (req, res) => {
  if (req.user) return res.redirect("/");

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = await google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
  ]);

  const cookieConfig = {
    httpOnly: true,
    secure: true,
    maxAge: 10 * 60 * 60 * 1000,
    sameSite: "lax",
  };

  res.cookie("google_oauth_state", state, cookieConfig);
  res.cookie("google_code_verifier", codeVerifier, cookieConfig);

  res.redirect(url.toString());
};


export const getGoogleLoginCallback = async (req, res) => {
  const { code, state } = req.query;
  const { google_oauth_state: storedState, google_code_verifier: codeVerifier } = req.cookies;


  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    req.flash("errors", "Couldn't login with Google because of invalid login attempt. Please try again!");
    return res.redirect("/login");
  }

  let tokens;
try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier);
    console.log("Google tokens:", tokens);

    if (!tokens.data || !tokens.data.id_token) {
        throw new Error("No ID token returned by Google");
    }
} catch (err) {
    console.error(err);
    req.flash("errors", "Couldn't login with Google because of invalid login attempt. Please try again!");
    return res.redirect("/login");
}


const claims = decodeIdToken(tokens.data.id_token, {
  clientId: process.env.GOOGLE_CLIENT_ID, 
  issuer: "https://accounts.google.com",  
});

const { sub: googleUserId, name, email } = claims;

  let user = await getUserWithOauthId({ provider: "google", email });

  if (user && !user.provider_account_id) {

    await linkUserWithOauth({
      userId: user.id,
      provider: "google",
      providerAccountId: googleUserId,
    });
  }

  if (!user) {

    user = await createUserWithOAuth({
      name,
      email,
      provider: "google",
      providerAccountId: googleUserId,
    });
  }

  
  const sessionId = await createSession(user.id, {
    ip: req.ip || req.connection.remoteAddress,
    user_agent: req.headers["user-agent"],
  });

  const accessToken = await createAccessToken({
    id: user.id,
    name,
    email,
    sessionId,
  });

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
};
