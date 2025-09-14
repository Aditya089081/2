// model/linkModel.js
import { db } from "../config/dbClient.js";

export const saveLink = async ({ shortcode, url, user_id }) => {
  const [result] = await db.execute(
    "INSERT INTO shortners (shortcode, url, user_id) VALUES (?, ?, ?)",
    [shortcode, url, user_id]
  );
  return result.insertId;
};


export const getLinkByShortCode = async (shortcode) => {
  const [rows] = await db.execute(
    "SELECT * FROM Shortners WHERE shortcode = ? LIMIT 1",
    [shortcode]
  );
  return rows[0];
};
export const getLinksByUser = async (user_id) => {
  const [rows] = await db.execute(
    "SELECT * FROM shortners WHERE user_id = ? ORDER BY created_at DESC",
    [user_id]
  );
  return rows;
};
export const findShortLinkById = async(id) =>{
  const [result] = await db.execute(
    "SELECT * FROM Shortners WHERE id = ? LIMIT 1",[id]
  );
  return result[0];
}
export const findSessionById = async(sessionId) =>{
  const [result] = await db.execute(
    "SELECT * FROM session WHERE id = ? LIMIT 1",[sessionId]
  );
  return result[0];
}

export const insertVarificationToken = async (user_id, token) => {
  const connection = await db.getConnection();
  try{
    // expire after 15 minutes
    await connection.beginTransaction();
          await connection.execute(
        "DELETE FROM verify_email WHERE expires_at < NOW()"
      );
      await connection.execute(
        "DELETE FROM verify_email WHERE user_id = ?",[user_id]
      );

      await connection.execute(
        "INSERT INTO verify_email (user_id, token) VALUES (?, ?)",
        [user_id, token]
      );
      await connection.commit();
  }
  catch(error){
    await connection.rollback();
    console.error("Varification code is not genwrated.");
    throw new Error("failed to validate the user.");
  }finally{
    connection.release();
  }
};

export const  verifyEmailAndUpdate = async(email) =>{
  return await db.execute(
    "UPDATE users  SET is_email_valid = TRUE  WHERE email = ?;",[email]
  );
}

// export const clearVerifyEmailToken = async (email=null)=>{
//   const [user]= await db.execute(
//     "SELECT id FROM users WHERE email = ?",[email]
//   );
//   try{

//     return await db.execute(
//       "DELETE FROM verify_email WHERE user_id = ?",[user.id]
//     )
//   }catch(error){
//     console.error(error);
//   }
// }
// With joins --->
export const clearVerifyEmailToken = async (email = null) => {
  try {
    return await db.execute(
      `DELETE ve 
       FROM verify_email ve
       JOIN users u ON ve.user_id = u.id
       WHERE u.email = ?`,
      [email]
    );
  } catch (error) {
    console.error(error);
  }
};
