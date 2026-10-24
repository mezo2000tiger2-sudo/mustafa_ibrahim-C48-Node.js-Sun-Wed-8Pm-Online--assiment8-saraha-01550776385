import nodemailer from "nodemailer";
import {randomInt}from 'node:crypto'
export const sendEmail=async({to ,subject ,html='',attachments ,text=''}={})=>{
    const transporter = nodemailer.createTransport({
        service:'gmail',
        auth: {
            user: 'mezo2000tiger2@gmail.com',
            pass: 'qzmzcynonqyeikwl'
        },
    });
    const info = await transporter.sendMail({
        from: '"mustafa ibrahim" <mezo2000tiger2@gmail.com>', // sender address
        to, // list of recipients
        subject, // subject line
        html,// HTML body
        text,
        attachments:attachments ||[]
    });
    console.log({info})
    return info.accepted.length > 0
}


export const generat_otp= ()=>{
    return  randomInt(100000,1000000).toString()
}