import jwt from 'jsonwebtoken'

export function authentication(req, res, next) {
  const { authorization } = req.headers

  if (!authorization) {
    return res.status(401).json({ message: 'authorization is required' })
  }

  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'invalid authorization format' })
  }

    req.user = jwt.verify(token, 'y-access')

    next()
}