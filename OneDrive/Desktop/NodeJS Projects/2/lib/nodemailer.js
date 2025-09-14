import nodemailer from 'nodemailer';
const testAccount = await nodemailer.createTestAccount();
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'reina.weber@ethereal.email',
        pass: 'nTrP8bnt5qBZBK2VRK'
    }
});
export const sendEmail = async({to,subject,html})=>{
    const info = await transporter.sendMail({
        from:`'URL SHORTNER' <${testAccount.user}>`,
        to,
        subject,
        html,
    });
    const testEmailURL = nodemailer.getTestMessageUrl(info);
    console.log(testEmailURL);
};