
import { nanoid } from "nanoid";
import { saveLink, getLinkByShortCode, getLinksByUser } from "../model/modelController.js";
import { getCountOfLink, getUserById } from "../model/user.js";
import { verifyJWTToken } from "../service/auth.js";

export const renderHome = async (req, res) => {
  try {
    const user = res.locals.user;
    if(!user){
      return res.render("index", { links:[], shortUrl: null, user:null });
    }
    const users = await getUserById(user.id);
    const links = await getLinksByUser(user.id);
    res.render("index", { links, shortUrl: null, user:{avatar:users.avatar} });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

export const handleShortner = async (req, res) => {
  const { url, shorten } = req.body;
  const shortId = shorten && shorten.trim() !== "" ? shorten.trim() : nanoid(6);


  try {
    const user = res.locals.user;
    if (!user) {
      req.flash("errors", "Please login first");
      return res.redirect("/login");
    }

    await saveLink({
      shortcode: shortId,
      url,
      user_id: user.id,
    });

    const host = req.headers.host;
    const shortUrl = `http://${host}/${shortId}`;

    const links = await getLinksByUser(user.id);

    res.render("index", { links, shortUrl, user });
  } catch (err) {
    console.error("Error saving link:", err);
    res.status(500).send("Internal Server Error");
  }
};

export const handleRedirect = async (req, res) => {
  const { shortId } = req.params;
  const link = await getLinkByShortCode(shortId);

  if (!link) return res.status(404).send("Short URL not found");
  res.redirect(link.url);
};

export const getMe = async (req, res) => {
  try {
   
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).render('error', {
        message: 'Please login to view your profile',
        loginLink: true
      });
    }

    const decoded = verifyJWTToken(accessToken);
    const user = await getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).render('error', {
        message: 'User not found',
        loginLink: true
      });
    }
    const link_count = await getCountOfLink(user.id);
    res.render("profile", { user:{
      id:user.id,
      name:user.name,
      email:user.email,
      links_count:link_count,
      is_email_valid:user.is_email_valid,
      passwordHash:Boolean(user.password),
      avatar:user.avatar,
      created_at:user.created_at,
    } });
    
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).render('error', {
      message: 'An error occurred while loading your profile',
      loginLink: true
    });
  }
};