import { Resend } from 'resend';

const resend = new Resend('re_94YsVyBq_ER9A9W65QuRpfYBTgDAV39HF');

export const sendEmail = async({to,subject,html})=>{
try{
    const {data,error}=await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'aktiwari089081@gmail.com',
  subject,
  html: html
});
if(error){
    return console.log(error);
}else{
    console.log(data);
}
}catch(error){
    console.log(error);
}};