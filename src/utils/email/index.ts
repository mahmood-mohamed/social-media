import nodemailer from "nodemailer";

export const sendMail = async ({ to , subject , text }: { to: string; subject: string; text: string }) => {
    const transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        service: "gmail", 
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    })

    await transport.sendMail({
        from: '"Social Media App" <process.env.EMAIL_USERNAME>',
        to: to ? to : "mhmooud35@gmail.com",
        subject: subject? subject : "Hello 👋 ...",
        text: text ? text : "Hi..."
    }).catch((error) => console.log("error in sending email >> ",error));

};
