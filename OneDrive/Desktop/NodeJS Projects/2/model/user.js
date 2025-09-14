
import { db } from "../config/dbClient.js";

export const getUserByEmail = async (email) => {
  const [rows] = await db.execute(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0];
};


export const getUserById = async (id) => {
  const [rows] = await db.execute(
    "SELECT * FROM Users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
};



export const createUser = async ({ name, email, password }) => {
  const [result] = await db.execute(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, password]
  );
  return result.insertId;
};
export const getCountOfLink = async(id)=>{
  const [counts] = await db.execute(
    "SELECT COUNT(*) AS count FROM shortners WHERE user_id = ?",[id]
  );
  return counts[0].count;
}

export const getUserWithOauthId = async ({ provider, email }) => {
  const [rows] = await db.execute(
    `SELECT 
        u.id,
        u.name,
        u.email,
        u.is_email_valid,
        o.provider_account_id,
        o.provider
     FROM users AS u
     LEFT JOIN oauth_accounts AS o
       ON u.id = o.user_id AND o.provider = ?
     WHERE u.email = ?`,
    [provider, email]
  );

  if (!rows || rows.length === 0) return null; // no user found
  const user = rows[0];
  console.log("user:", user);
  return user;
};

export const linkUserWithOauth = async({userId,provider,providerAccountId})=>{
  console.log(userId,provider,providerAccountId);
  await db.execute(
    "INSERT INTO oauth_accounts (user_id,provider,provider_account_id) VALUES (?, ?, ?)",[userId,provider,providerAccountId]
  )
}
export const createUserWithOAuth = async ({ email, name, provider, providerAccountId }) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO users (email, name, is_email_valid)
       VALUES (?, ?, ?)`,
      [email, name, true]
    );

    const userId = result.insertId; 

    await connection.execute(
      `INSERT INTO oauth_accounts (provider, provider_account_id, user_id)
       VALUES (?, ?, ?)`,
      [provider, providerAccountId, userId]
    );

    await connection.commit();

    return {
      id: userId,
      name,
      email,
      isEmailValid: true,
      provider,
      providerAccountId
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
