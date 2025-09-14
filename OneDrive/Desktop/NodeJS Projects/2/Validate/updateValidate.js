import z from "zod";
 export const shortnerSchema = z.object({
    url:
    z.string({required_error:"URL is required"})
    .trim()
    .url({message:"Please provide valid URL"})
    .max(25,{message:"Please provide valid URL"}),
    shorten:
    z.string()
    .trim()
    .min(1,{message:"change the short code"})
    .max(10,{message:"Short Code can't be more than 10 character."}),
 })

 export const updateUserSchema = z.object({
   name:
       z.string()
       .trim()
       .min(3,{message:"Name must be at least 3 character long."})
       .max(25,{message:"Name can't be more than 25 character"}),
 })