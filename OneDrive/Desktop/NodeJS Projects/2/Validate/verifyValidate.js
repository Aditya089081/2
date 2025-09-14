import z from "zod";
export const verifyEmailSchema = z.object({
    token:z.string().trim().length(8,{message:"Code must be 8 digit long."}),
    email:z.string().trim().email(),
})
export const forgotUserSchema = z.object(
    {
        email:z
        .string()
        .trim()
        .email()
        .max(25,{message:"Email is not valid"}),
    }
)