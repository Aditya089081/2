import z from "zod";
export const ShortLinkSchema = z.object({
    url:
    z.string()
    .url()
    .trim()
    .min(4,{message:"Please Provide Valid link."})
    .max(50,{message:"Please Provide Valid link."}),
    shorten:
    z.string()
    .trim()
    .max(10,{message:"Short Code can't be more than 10 character."}),
})
export const LoginUserSchema = z.object({
    email:
    z.string()
    .trim()
    .email({message:"Please enter a valid email Address."})
    .max(25,{message:"Please enter a valid email."}),
    password:
    z.string()
    .trim()
    .min(6,{message:"Password must be at least 6 character long."})
    .max(25,{message:"Password can't be more than 25 character"}),
})
export const registerUserSchema = LoginUserSchema.extend({
    name:
    z.string()
    .trim()
    .min(3,{message:"Name must be at least 3 character long."})
    .max(25,{message:"Name can't be more than 25 character"}),
        
})
export const resetPasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, { message: "Current password is required!" }),

    newPassword: z
        .string()
        .min(6, { message: "New Password must be at least 6 characters long." })
        .max(100, { message: "New Password must be no more than 100 characters." })
        .regex(/[A-Z]/, { message: "New Password must contain at least one uppercase letter." })
        .regex(/[0-9]/, { message: "New Password must contain at least one number." })
        .regex(/[^A-Za-z0-9]/, { message: "New Password must contain at least one special character." }),

    confirmPassword: z
        .string()
        .min(6, { message: "Confirm Password must be at least 6 characters long." })
        .max(100, { message: "Confirm Password must be no more than 100 characters." })
        .regex(/[A-Z]/, { message: "Confirm Password must contain at least one uppercase letter." })
        .regex(/[0-9]/, { message: "Confirm Password must contain at least one number." })
        .regex(/[^A-Za-z0-9]/, { message: "Confirm Password must contain at least one special character." }),
}).refine((data) => data.confirmPassword === data.newPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
export const forgotPasswordSchema = z.object({
  newPassword: z.string()
    .min(6, { message: "New Password must be at least 6 characters long." })
    .max(100, { message: "New Password must be no more than 100 characters." })
    .regex(/[A-Z]/, { message: "New Password must contain at least one uppercase letter." })
    .regex(/[0-9]/, { message: "New Password must contain at least one number." })
    .regex(/[^A-Za-z0-9]/, { message: "New Password must contain at least one special character." }),

  confirmPassword: z.string(),
}).refine((data) => data.confirmPassword === data.newPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

