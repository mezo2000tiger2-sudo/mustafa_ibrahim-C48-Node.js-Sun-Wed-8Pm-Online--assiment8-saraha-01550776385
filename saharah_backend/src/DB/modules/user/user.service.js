import userModel from "../../models/user.model.js"
import jwt from 'jsonwebtoken'
import { OAuth2Client } from "google-auth-library"
import * as dbService from '../../db.service.js'
import { Decrypt, Encrypt } from "../../common/security/encrypt.js"
import { Compare, Hash } from "../../common/security/hash.js"
import { ProvidorEnum } from "../../common/enum/user.enum.js"


const client = new OAuth2Client();


export async function signUp(req ,res){
        const {fName , lName , email, password ,age ,gender,phone}=req.body
                console.log('test',req.files)


    const user = await dbService.create({
        model:userModel,
        data:{fName , lName , email, password:await Hash(password) ,age ,gender ,phone: phone ? Encrypt(phone) : undefined , avatar:req.files?.avatar?.[0]?.path , profile:req.files?.profile?.map(file => file.path)}
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
                ,avatar:picture
                ,isConfirmed:email_verified,
                providor:ProvidorEnum.google
            }
        })
    }

if (user.provider === ProvidorEnum.system) {
     throw new Error('login with system only')
}
    const token_access =jwt.sign({userId:user._id} ,'y-access',{
        expiresIn:60 * 5,
    })
    const token_refresh =jwt.sign({userId:user._id} ,'y-refresh')


    return res.status(200).json({message:'done',user:{name:user.fullName ,email:user.email },token:{token_access ,token_refresh}})
    console.log(playload)

}


export async function signUpWithGithub(req ,res){
    const {accessToken}=req.body
    if(!accessToken){
        throw new Error('access token is required',{cause:400})
    }
    const headers={Authorization:`Bearer ${accessToken}`}

    const response=await fetch('https://api.github.com/user',{headers})
    if(!response.ok){
        throw new Error('invalid access token',{cause:401})
    }
    const {avatar_url,name,login} =await response.json()

    const emailsRes=await fetch('https://api.github.com/user/emails',{headers})
    if(!emailsRes.ok){
        throw new Error('unable to read github emails',{cause:400})
    }
    const emails=await emailsRes.json()
    if(!Array.isArray(emails)){
        throw new Error('invalid github emails response',{cause:502})
    }
    const email=emails.find(e=>e.primary && e.verified)?.email
    if(!email){
        throw new Error('no verified email on github account',{cause:400})
    }

    let user = await dbService.findOne({
        model:userModel,
        filter:{
            email:email.toLowerCase()
        }
    })
    if(!user){
        const [given_name,...rest]=(name || login).trim().split(' ').filter(Boolean)
        const family_name=rest.join(' ') || login
        if(given_name.length < 2 || given_name.length > 50 || family_name.length < 2 || family_name.length > 50){
            throw new Error('github first and last names must be 2-50 characters',{cause:400})
        }
        [user] = await dbService.create({
            model:userModel,
            data:{fName:given_name
                , lName:family_name
                , email:email.toLowerCase()
                ,avatar:avatar_url
                ,isConfirmed:true,
                providor:ProvidorEnum.github
            }
        })
    }

    if (user.providor !== ProvidorEnum.github) {
        throw new Error(`login with your original provider = ${user.providor}`,{cause:409})
    }
    const token_access =jwt.sign({userId:user._id} ,'y-access',{
        expiresIn:60 * 5,
    })
    const token_refresh =jwt.sign({userId:user._id} ,'y-refresh')

    return res.status(200).json({message:'done',user:{name:user.fullName ,email:user.email },token:{token_access ,token_refresh}})
}

export async function getProfile(req, res) {
  const user = req.user

  return res.status(200).json({
    message: 'done',
    user: { ...user._doc, phone: user.phone ? Decrypt(user.phone) : user.phone },
  })
}

export async function signIn(req ,res){
        const {email, password}=req.body

    const user = await dbService.findOne({
        model:userModel,
        filter:{email:email.toLowerCase() }
    })
    
    if(!user){
        throw new Error('email not exist or you can login on signUp')
    }
    if(user.providor !== ProvidorEnum.system){
        throw new Error(`login with your original provider = ${user.providor}`)
    }
    if(user.isConfirmed !== true){
        throw new Error('account not confirmed')

    } 
    if(!await Compare(password ,user.password)){
        throw new Error('inValid password')
    }
    const token_access =jwt.sign({userId:user._id} ,'y-access',{
        expiresIn:60 * 5,
        audience:'https://localhost:4000',
        issuer:'https://localhost:3000 ',
        // notBefore:60,
        // noTimestamp:true
    })
    const token_refresh =jwt.sign({userId:user._id} ,'y-refresh',{
        expiresIn:60
    })


    return res.status(200).json({message:'done',user:{name:user.fullName ,email:user.email },token:{token_access ,token_refresh}})

}
