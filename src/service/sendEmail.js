import nodemailer from "nodemailer";
import {randomInt}from 'node:crypto'
import { EMAIL, PASSWORD } from "../../config/config.service.js";
export const sendEmail=async({to ,subject ,html='',attachments ,text=''}={})=>{
    const transporter = nodemailer.createTransport({
        service:'gmail',
        auth: {
            user: EMAIL,
            pass: PASSWORD
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
    return info.accepted.length > 0
}


export const generat_otp= ()=>{
    return  randomInt(100000,1000000).toString()
}