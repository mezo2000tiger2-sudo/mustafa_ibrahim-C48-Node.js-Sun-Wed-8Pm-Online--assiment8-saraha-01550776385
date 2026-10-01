import userModel from "../../models/user.model.js"
import jwt from 'jsonwebtoken'
import { OAuth2Client } from "google-auth-library"
import * as dbService from '../../db.service.js'
import { Decrypt, Encrypt } from "../../common/security/encrypt.js"
import { Compare, Hash } from "../../common/security/hash.js"


const client = new OAuth2Client();


export async function signUp(req ,res){
        const {fName , lName , email, password ,age ,gender,phone}=req.body

    const user = await dbService.create({
        model:userModel,
        data:{fName , lName , email, password:await Hash(password) ,age ,gender ,phone:Encrypt(phone)}
    })
    return res.status(201).json({message:'done',user})
}


export async function signUpWithGmail(req ,res){
    const {idToken}=req.body

    const decoded = await client.verifyIdToken({
        idToken,
        audience: '1091439877151-u23ui17d3vke64q0gphg9is6hdd1n1ri.apps.googleusercontent.com',
    });
    const {picture,given_name,family_name,email,email_verified} =decoded.getPayload()
        let user = await dbService.findOne({
        model:userModel,
        filter:{
            email:email.toLowerCase()
        }
    })
    if(!user){
        user = await dbService.create({
            model:userModel,
            data:{fName:given_name
                , lName:family_name
                , email
                ,profileImage:picture
                ,isConfirmed:email_verified,
                providor:'google'
            }
        })
    }

if (user.provider === "system") {
     throw new Error('login with system only')
}
            const token_access =jwt.sign({userId:user._id,email:user.email} ,'y-access',{
        expiresIn:60 * 5,
    })
    const token_refresh =jwt.sign({userId:user._id,email:user.email} ,'y-refresh')


    return res.status(200).json({message:'done',user:{name:user.fullName ,email:user.email },token:{token_access ,token_refresh}})
    console.log(playload)

}


export async function getProfile(req, res) {
  const user = await dbService.findOne({
    model: userModel,
    filter: {
      email: req.user.email.toLowerCase(),
    },
  })
  if (!user) {
    throw new Error('user not found')
  }

  return res.status(200).json({
    message: 'done',
    user: { ...user._doc, phone: Decrypt(user.phone) },
  })
}

export async function signIn(req ,res){
        const {email, password}=req.body

    const user = await dbService.findOne({
        model:userModel,
        filter:{email:email.toLowerCase() ,providor:'system'}
    })
    if(!user){
        throw new Error('email not exist or you can login on signUp')
    }
    if(user.isConfirmed !== true){
        throw new Error('account not confirmed')

    }
    if(!await Compare(password ,user.password)){
        throw new Error('inValid password')
    }
    const token_access =jwt.sign({userId:user._id,email:user.email} ,'y-access',{
        expiresIn:60 * 5,
        audience:'https://localhost:4000',
        issuer:'https://localhost:3000 ',
        // notBefore:60,
        // noTimestamp:true
    })
    const token_refresh =jwt.sign({userId:user._id,email:user.email} ,'y-refresh',{
        expiresIn:60
    })


    return res.status(200).json({message:'done',user:{name:user.fullName ,email:user.email },token:{token_access ,token_refresh}})

}