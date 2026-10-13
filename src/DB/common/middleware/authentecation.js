import jwt from 'jsonwebtoken'
import userModel from '../../models/user.model.js'
import * as dbService from '../../db.service.js'
import revokeTokenModel from '../../models/revokeToken.model.js'

export async function authentication(req, res, next) {
  const { authorization } = req.headers

  if (!authorization) {
    return res.status(401).json({ message: 'authorization is required' })
  }

  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'invalid authorization format' })
  }

    const payload = jwt.verify(token, 'y-access')
    const user = await dbService.findOne({
    model: userModel,
    filter: {
      _id: payload.userId
    },
  })
  if(!user){
    throw new Error('user not found',{cause:404})
  }

  if(user.changeCredentialsAt?.getTime() > payload.iat * 1000){
    throw new Error('token has expired',{cause:401})
  }
  if(await dbService.findOne({
    model: revokeTokenModel,
    filter: { tokenId: payload.jti } })){

    throw new Error('token expired from this device',{cause:401})
  }
  req.user = user
  req.payload = payload
    next()
}