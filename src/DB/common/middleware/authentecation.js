import jwt from 'jsonwebtoken'
import userModel from '../../models/user.model.js'
import * as dbService from '../../db.service.js'

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
  req.user = user
  req.payload = payload
    next()
}