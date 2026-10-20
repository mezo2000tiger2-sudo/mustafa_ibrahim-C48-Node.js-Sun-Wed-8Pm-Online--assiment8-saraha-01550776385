import userModel from "../../models/user.model.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import * as dbService from "../../service/db.service.js";
import { Decrypt, Encrypt } from "../../common/security/encrypt.js";
import { Compare, Hash } from "../../common/security/hash.js";
import { ProvidorEnum } from "../../common/enum/user.enum.js";
import { unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { deleteKey, getTTL, getValue, incr, setValue } from "../../service/redis.service.js";
import { generat_otp, sendEmail } from "../../../service/sendEmail.js";
import { eventEmitter } from "../../common/utils/events.js";

const client = new OAuth2Client();

//================ signUp ==========================
export async function signUp(req, res) {
  const { fName, lName, email, password, age, gender, phone } = req.body;

  const otp =await generat_otp()
  const otpHash=Hash(otp)
  await setValue({
    key:`otp::${email}`,
    value:otpHash,
    ttl: 60 * 2
  })

  await setValue({
    key:`otp::max::${email}`,
    value:1,
    ttl: 60 * 5
  })

  

  
  eventEmitter.emit('Confirm_email',async()=>{
    sendEmail({
      subject:'email confirm',
      to: email,
      html:`<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Confirm your email</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Your saharah confirmation code is ${otp}. It expires in 2 minutes.
    </div>
   
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;">
            <tr>
              <td style="padding:32px 32px 8px 32px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#111827;">
                saharah
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px;font-family:Helvetica,Arial,sans-serif;font-size:22px;line-height:30px;font-weight:700;color:#111827;">
                Confirm your email address
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 0 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;color:#4b5563;">
                Hi ${fName +' '+ lName}, enter this code in saharah to finish creating your account.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="background-color:#f3f4f6;border-radius:8px;padding:20px 0;font-family:'Courier New',Courier,monospace;font-size:36px;line-height:40px;font-weight:700;letter-spacing:10px;color:#111827;">
                      ${otp}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#6b7280;">
                This code expires in 2 minutes. If you didn't request it, you can ignore this email and no account will be created.
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
            <tr>
              <td align="center" style="padding:16px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:#9ca3af;">
                Sent by sahara
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`,
  })
  })




  let user;
  try {
    user = await dbService.create({
      model: userModel,
      data: {
        fName,
        lName,
        email,
        password: await Hash(password),
        age,
        gender,
        phone: phone ? Encrypt(phone) : undefined,
        avatar: req.file?.path,
      },
    });
  } catch (error) {
    if (req.file) {
      await unlink(req.file.path).catch((cleanupError) => {
        console.error("Failed to delete uploaded file:", cleanupError);
      });
    }

    if (error.code === 11000) {
      throw new Error("Email already exists", { cause: 409 });
    }

    throw error;
  }

  return res.status(201).json({ message: "done", user });
}

//================ signUpWithGmail ==========================
export async function signUpWithGmail(req, res) {
  const { idToken } = req.body;

  const decoded = await client.verifyIdToken({
    idToken,
    audience:
      "1091439877151-u23ui17d3vke64q0gphg9is6hdd1n1ri.apps.googleusercontent.com",
  });
  const { picture, given_name, family_name, email, email_verified } =
    decoded.getPayload();
  let user = await dbService.findOne({
    model: userModel,
    filter: {
      email: email.toLowerCase(),
    },
  });
  if (!user) {
    user = await dbService.create({
      model: userModel,
      data: {
        fName: given_name,
        lName: family_name,
        email,
        avatar: picture,
        isConfirmed: email_verified,
        providor: ProvidorEnum.google,
      },
    });
  }

  if (user.provider === ProvidorEnum.system) {
    throw new Error("login with system only");
  }
  const tokenId = randomUUID();
  const token_access = jwt.sign({ userId: user._id }, "y-access", {
    expiresIn: 60 * 5,
    jwtid: tokenId,
  });
  const token_refresh = jwt.sign({ userId: user._id }, "y-refresh", {
    expiresIn: "7d",
    jwtid: tokenId,
  });

  return res
    .status(200)
    .json({
      message: "done",
      user: { name: user.fullName, email: user.email },
      token: { token_access, token_refresh },
    });
  console.log(playload);
}

//================ signUpWithGithub ==========================

export async function signUpWithGithub(req, res) {
  const { accessToken } = req.body;
  if (!accessToken) {
    throw new Error("access token is required", { cause: 400 });
  }
  const headers = { Authorization: `Bearer ${accessToken}` };

  const response = await fetch("https://api.github.com/user", { headers });
  if (!response.ok) {
    throw new Error("invalid access token", { cause: 401 });
  }
  const { avatar_url, name, login } = await response.json();

  const emailsRes = await fetch("https://api.github.com/user/emails", {
    headers,
  });
  if (!emailsRes.ok) {
    throw new Error("unable to read github emails", { cause: 400 });
  }
  const emails = await emailsRes.json();
  if (!Array.isArray(emails)) {
    throw new Error("invalid github emails response", { cause: 502 });
  }
  const email = emails.find((e) => e.primary && e.verified)?.email;
  if (!email) {
    throw new Error("no verified email on github account", { cause: 400 });
  }

  let user = await dbService.findOne({
    model: userModel,
    filter: {
      email: email.toLowerCase(),
    },
  });
  if (!user) {
    const [given_name, ...rest] = (name || login)
      .trim()
      .split(" ")
      .filter(Boolean);
    const family_name = rest.join(" ") || login;
    if (
      given_name.length < 2 ||
      given_name.length > 50 ||
      family_name.length < 2 ||
      family_name.length > 50
    ) {
      throw new Error("github first and last names must be 2-50 characters", {
        cause: 400,
      });
    }
    [user] = await dbService.create({
      model: userModel,
      data: {
        fName: given_name,
        lName: family_name,
        email: email.toLowerCase(),
        avatar: avatar_url,
        isConfirmed: true,
        providor: ProvidorEnum.github,
      },
    });
  }

  if (user.providor !== ProvidorEnum.github) {
    throw new Error(`login with your original provider = ${user.providor}`, {
      cause: 409,
    });
  }
  const tokenId = randomUUID();
  const token_access = jwt.sign({ userId: user._id }, "y-access", {
    expiresIn: 60 * 5,
    jwtid: tokenId,
  });
  const token_refresh = jwt.sign({ userId: user._id }, "y-refresh", {
    expiresIn: "7d",
    jwtid: tokenId,
  });

  return res
    .status(200)
    .json({
      message: "done",
      user: { name: user.fullName, email: user.email },
      token: { token_access, token_refresh },
    });
}

//================ confrimEmail ==========================
export async function confrimEmail(req, res) {
  const { email, otp } = req.body;
  const otpValue =await getValue({key:`otp::${email}`})

  if(!otpValue){
    throw new Error('otp expired',{cause:400})
  }
  if (!Compare(otp, otpValue)) {
  throw new Error('otp invalid', { cause: 400 });
  }
  const user = await dbService.findOneAndUpdate({
    model:userModel,
    filter:{email,isConfirmed:false},
    update:{isConfirmed:true}
  })

  deleteKey(`otp::${email}`)


  if(!user){
    throw new Error('user not exist',{cause:400})
  }
  return res.status(200).json({message: "done",});
}

//================ resendOtp ==========================
export async function resendOtp(req, res) {
  const { email } = req.body;
  const isBlocked_ttl = getTTL({key:`otp::block::${email}`})
  if(isBlocked_ttl > 0) throw new Error(`you are blocked , you can retry after ${isBlocked}`)

  const otpTTl =await getTTL({key:`otp::${email}`})
  if(otpTTl > 0) throw new Error(`you can send otp after ${otpTTl}`)

  const otpMax =await getValue({key:`otp::max::${email}`})
  if(otpMax >=3) {
    await setValue({
      key:`otp::block::${email}`,
      value:'1',
      ttl:60 *10
    })
    throw new Error('you have reached your maximum number of tries')
  }

  
  const user = dbService.findOne({
    model:userModel,
    filter:{
      email,
      isConfirmed:false
    }
  })
  if(!user)throw new Error ('user not exist or already confirmed')
    const otp =await generat_otp()
  const otpHash=Hash(otp)
  await setValue({
    key:`otp::${email}`,
    value:otpHash,
    ttl: 60 * 2
  })
  
  eventEmitter.emit('Confirm_email',async()=>{
    sendEmail({
      subject:'email confirm',
      to: email,
      html:`<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Confirm your email</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Your saharah confirmation code is ${otp}. It expires in 2 minutes.
    </div>
   
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;">
            <tr>
              <td style="padding:32px 32px 8px 32px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#111827;">
                saharah
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px;font-family:Helvetica,Arial,sans-serif;font-size:22px;line-height:30px;font-weight:700;color:#111827;">
                Confirm your email address
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 0 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;color:#4b5563;">
                Hi ${fName +' '+ lName}, enter this code in saharah to finish creating your account.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="background-color:#f3f4f6;border-radius:8px;padding:20px 0;font-family:'Courier New',Courier,monospace;font-size:36px;line-height:40px;font-weight:700;letter-spacing:10px;color:#111827;">
                      ${otp}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#6b7280;">
                This code expires in 2 minutes. If you didn't request it, you can ignore this email and no account will be created.
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
            <tr>
              <td align="center" style="padding:16px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:#9ca3af;">
                Sent by sahara
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`,
  })
  })
  await incr(`otp::max::${email}`)

  return res.status(200).json({message:'Done',user})

}

//================ signIn ==========================
export async function signIn(req, res) {
  const { email, password } = req.body;

  const user = await dbService.findOne({
    model: userModel,
    filter: { email: email.toLowerCase(),isConfirmed:true,providor:ProvidorEnum.system },
  });

  if (!user) {
    throw new Error("email not exist or you can login on signUp");
  }
  if (user.providor !== ProvidorEnum.system) {
    throw new Error(`login with your original provider = ${user.providor}`);
  }
  if (user.isConfirmed !== true) {
    throw new Error("account not confirmed");
  }
  if (!(await Compare(password, user.password))) {
    throw new Error("inValid password");
  }
  const tokenId = randomUUID();
  const token_access = jwt.sign({ userId: user._id }, "y-access", {
    expiresIn: 60 * 5,
    audience: "https://localhost:4000",
    issuer: "https://localhost:3000 ",
    jwtid: tokenId,
    // notBefore:60,
    // noTimestamp:true
  });
  const token_refresh = jwt.sign({ userId: user._id }, "y-refresh", {
    expiresIn: "7d",
    jwtid: tokenId,
  });

  return res
    .status(200)
    .json({
      message: "done",
      user: { name: user.fullName, email: user.email },
      token: { token_access, token_refresh },
    });
}
//================ refreshToken ==========================
export async function refreshToken(req, res) {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ message: "authorization is required" });
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "invalid authorization format" });
  }

  const payload = jwt.verify(token, "y-refresh");
  const user = await dbService.findOne({
    model: userModel,
    filter: {
      _id: payload.userId,
    },
  });
  if (!user) {
    throw new Error("user not found with this refresh token", { cause: 404 });
  }
  const token_access = jwt.sign({ userId: user._id }, "y-access", {
    expiresIn: 60 * 5,
  });

  return res.status(200).json({ message: "done", token: { token_access } });
}
//================ getProfile ==========================
export async function getProfile(req, res) {
  const user = req.user;

  return res.status(200).json({
    message: "done",
    user: {
      ...user._doc,
      phone: user.phone ? Decrypt(user.phone) : user.phone,
    },
  });
}
//================ shareProfile ==========================
export async function shareProfile(req, res) {
  const { id } = req.params;
  const user = await dbService.findById({
    model: userModel,
    id,
    options: {
      password: 0,
      __v: 0,
      isConfirmed: 0,
    },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }
  if (user.phone) {
    user.phone = Decrypt(user.phone);
  }

  return res.status(200).json({
    message: "done",
    user,
  });
}

//================ updateProfile ==========================
export async function updateProfile(req, res) {
  const { fName, lName, age, gender, phone } = req.body;
  let updateQuery = {};
  if (fName !== undefined) updateQuery.fName = fName;
  if (lName !== undefined) updateQuery.lName = lName;
  if (age !== undefined) updateQuery.age = age;
  if (gender !== undefined) updateQuery.gender = gender;
  if (phone !== undefined) updateQuery.phone = Encrypt(phone);
  const updatedUser = await dbService.findByIdAndUpdate({
    model: userModel,
    id: req.user._id,
    update: updateQuery,
  });

  return res.status(201).json({ message: "done", updatedUser });
}
//================ updatePassword ==========================
export async function updatePassword(req, res) {
  const { oldpassword, newpassword } = req.body;
  const user = req.user;
  if (!Compare(oldpassword, req.user.password)) {
    throw new Error("inValid old password");
  }
  user.password = Hash(newpassword);
  user.changeCredentialsAt = new Date();
  const updatedUser = await dbService.findByIdAndUpdate({
    model: userModel,
    id: req.user._id,
    update: { password: user.password },
  });

  return res.status(201).json({ message: "done", updatedUser });
}

//================ logout ==========================
export async function logout(req, res) {
  const { flag } = req.query;
  const user = req.user;
  if (flag && flag === "all") {
    user.changeCredentialsAt = new Date();
    const updatedUser = await dbService.findByIdAndUpdate({
      model: userModel,
      id: req.user._id,
      update: { changeCredentialsAt: user.changeCredentialsAt },
    });
    
    await deleteKey(await keys(`revoke_token::${user._id}`))

  } else {
    console.log(req.payload.exp  - Math.floor((Date.now()/1000)))

    await setValue({
      key:`revoke_token::${user._id}::${req.payload.jti}`,
      value:`${req.payload.jti}`,
      ttl:req.payload.exp  - Math.floor((Date.now()/1000))
    })

  }
  return res.status(201).json({ message: "done" });
}
