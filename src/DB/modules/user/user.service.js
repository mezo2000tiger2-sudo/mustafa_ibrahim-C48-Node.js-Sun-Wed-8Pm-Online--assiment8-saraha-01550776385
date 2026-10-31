import userModel from "../../models/user.model.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import * as dbService from "../../service/db.service.js";
import { Decrypt, Encrypt } from "../../common/security/encrypt.js";
import { Compare, Hash } from "../../common/security/hash.js";
import { ProvidorEnum } from "../../common/enum/user.enum.js";
import { unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { deleteKey, getTTL, getValue, getValues, incr, setValue, setValues } from "../../service/redis.service.js";
import { generat_otp, sendEmail } from "../../../service/sendEmail.js";
import { eventEmitter } from "../../common/utils/events.js";
import { emailTemplate } from "../../common/utils/email.template.js";
import { SendEmailOtp } from "./user.helper.js";
import { success_response } from "../../common/utils/successResponse.js";

const client = new OAuth2Client();

//================ signUp ==========================
export async function signUp(req, res) {
  const { fName, lName, email, password, age, gender, phone } = req.body;

  const otp = generat_otp()
  const otpHash=Hash(otp)
  await setValues([
    {
      key:`otp::${email}`,
      value:otpHash,
      ttl: 60 * 2
    },
    {
      key:`otp::max::${email}`,
      value:1,
      ttl: 60 * 10
    }
  ])

  

  
  eventEmitter.emit('Confirm_email',async()=>{
    sendEmail({
      subject:'email confirm',
      to: email,
      html:emailTemplate({otp}),
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
        password: Hash(password),
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

  return success_response({ res, statusCode: 201, data: { user } });
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

  if (!user.providor === ProvidorEnum.google) {
    throw new Error(`login with your original provider = ${user.providor}`);
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
  
  return success_response({
    res,
    data: {
      user: { name: user.fullName, email: user.email },
      token: { token_access, token_refresh },
    },
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
  console.log({response})
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
  return success_response({
    res,
    data: {
      user: { name: user.fullName, email: user.email },
      token: { token_access, token_refresh },
    },
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
    filter:{email,isConfirmed:{$exists:false}},
    update:{isConfirmed:true}
  })

  deleteKey(`otp::${email}`)
  deleteKey(`otp::max::${email}`)
  deleteKey(`otp::block::${email}`)


  if(!user){
    throw new Error('user not exist',{cause:400})
  }
  return success_response({ res });
}

//================ resendOtp ==========================
export async function resendOtp(req, res) {
  const { email } = req.body;
  await SendEmailOtp({email,isConfirmed:false , subject:'confirm email'})

  return success_response({ res, message: "Done" });

}

//================ signIn ==========================
export async function signIn(req, res) {
  const { email, password } = req.body;

  const user = await dbService.findOne({
    model: userModel,
    filter: { email: email.toLowerCase(),isConfirmed:{$exists:true},providor:ProvidorEnum.system },
  });

  if (!user) {
    throw new Error("email not exist");
  }
  if (user.providor !== ProvidorEnum.system) {
    throw new Error(`login with your original provider = ${user.providor}`);
  }
  if (!user.isConfirmed) {
    throw new Error("account not confirmed");
  }
  if (! Compare(password, user.password)) {
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
  return success_response({
    res,
    data: {
      user: { name: user.fullName, email: user.email },
      token: { token_access, token_refresh },
    },
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
  
  return success_response({ res, data: { token: { token_access } } });
}
//================ getProfile ==========================
export async function getProfile(req, res) {
  const user = req.user;

  return success_response({
    res,
    data: {
      user: {
        ...user._doc,
        phone: user.phone ? Decrypt(user.phone) : user.phone,
      },
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

  return success_response({ res, data: { user } });
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

  return success_response({ res, statusCode: 201, data: { updatedUser } });
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

  return success_response({ res, statusCode: 201, data: { updatedUser } });
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
  return success_response({ res, statusCode: 201 });
}

//================ forgetPassword ==========================
export async function forgetPassword(req, res) {
  const { email } = req.body;
  await SendEmailOtp({email ,isConfirmed:true,subject:'forget password'})

  return success_response({ res, message: "Done" });
}

//================ resetPassword ==========================
export async function resetPassword(req, res) {
  const { email,otp,password } = req.body;
  const otpValue = await getValue({key:`otp::${email}`})
  if(!otpValue)throw new Error(`token expire`)
    if (!Compare(otp, otpValue)) {
  throw new Error('otp invalid', { cause: 400 });
  }
  const user =await dbService.findOneAndUpdate({
    model:userModel,
    filter:{
      email,
      isConfirmed:{$exists:true}
    },
    update:{
      password:Hash(password),
      changeCredentialsAt:new Date()
    }
  })
  if(!user) throw new Error('user not exist or not confirmed')
    await deleteKey(`otp::${email}`)
  return success_response({ res, message: "Done" });
}
