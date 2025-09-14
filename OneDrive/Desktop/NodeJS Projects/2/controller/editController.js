import { db } from "../config/dbClient.js";
import { findShortLinkById } from "../model/modelController.js";
import z from 'zod';
import { getUserById } from "../model/user.js";
export const getEdit = async(req,res)=>{
    if(!res.locals.user) return res.redirect("/login");
    const {data:id,error} = z.coerce.number().int().safeParse(req.params.id);
    if(error) return res.redirect("/404");
    try{
        const shortLink = await findShortLinkById(id);
        // const user = getUserById(id);
        res.render("edit-shortLink",{
            id:shortLink.id,
            url:shortLink.url,
            shortcode:shortLink.shortcode,
            errors:req.flash("errors"),
            // user:{avatar:user.avatar},
        })
    }catch(err){
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
    
}

export const postEdit = async (req, res) => {


  const { id } = req.params;
  const { url, shortcode } = req.body;
console.log({ url, shortcode, id, user: res.locals.user });

  try {
    await db.execute(
      "UPDATE shortners SET url = ?, shortcode = ? WHERE id = ? AND user_id = ?",
      [ url, shortcode, id, res.locals.user.id ]
    );

    req.flash("success", "Short link updated!");
    res.redirect("/");
  } catch (err) {
    console.error(err);
    req.flash("errors", "Failed to update link");
    res.redirect(`/edit/${id}`);
  }
};

export const deleteLink = async(req,res)=>{
    if (!res.locals.user) return res.redirect("/login");

  try {
    const { data: id, error } = z.coerce.number().int().safeParse(req.params.id);
    if (error) return res.redirect("/404");

    
    await db.execute(
      "DELETE FROM shortners WHERE id = ? AND user_id = ?",
      [id, res.locals.user.id]
    );

    req.flash("success", "Short link deleted successfully!");
    return res.redirect("/");
  } catch (err) {
    console.error(err);
    req.flash("errors", "Failed to delete link");
    res.redirect(`/`);
  }
}