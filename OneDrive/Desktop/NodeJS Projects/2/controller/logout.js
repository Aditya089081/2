import { db } from "../config/dbClient.js";

const clearSeassion = async(sessionId)=>{
    await db.execute(
        "DELETE FROM session WHERE id = ?;",[sessionId]
    );
}
export const handleLogout = async(req,res)=>{
    const user = req.user||res.locals.user;
    await clearSeassion(user?.sessionId)
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.redirect("/");
}