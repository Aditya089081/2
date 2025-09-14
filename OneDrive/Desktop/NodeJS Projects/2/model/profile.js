import { db } from "../config/dbClient.js"

export const updateUser = async ({ name, email, avatarUrl }) => {
    if (avatarUrl) {
        return await db.execute(
            "UPDATE users SET name = ?, avatar = ? WHERE email = ?",
            [name, avatarUrl, email]
        );
    } else {
        return await db.execute(
            "UPDATE users SET name = ? WHERE email = ?",
            [name, email]
        );
    }
};

export const UpdatePassword = async(id,newPassword)=>{
    return await db.execute(
        "UPDATE users SET password = ? WHERE id = ?",[newPassword,id]
    );
}
export const clearResetPasswordToken = async () => {
  return await db.execute(
    "DELETE FROM password_reset_token WHERE expires_at < NOW()"
  );
};

export const getIdByToken = async(token)=>{
    console.log("tokenhash: ",token);
    await clearResetPasswordToken();
    const [rows] = await db.execute(
        "SELECT user_id FROM password_reset_token WHERE token_hash = ?",[token]
    );
    return rows.length > 0 ? rows[0].user_id : null;
}
export const deleteToken = async (tokenHash) => {
  return await db.execute(
    "DELETE FROM password_reset_token WHERE token_hash = ?", 
    [tokenHash]
  );
};
export const setUserPassword = async(user_id,hashPassword)=>{
    console.log("hashPassword: ",hashPassword);
    console.log("user_id: ",user_id);
    return await db.execute(
        "UPDATE users  SET password = ?  WHERE id = ?",[hashPassword,user_id]
    );
}