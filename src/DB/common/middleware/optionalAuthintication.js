import jwt from "jsonwebtoken";
import userModel from "../../models/user.model.js";
import * as dbService from "../../service/db.service.js";
import { getTTL } from "../../service/redis.service.js";

export async function optionalAuthentication(req, res, next) {
  if(req.headers['authorization']){

    const { authorization } = req.headers;
  
    if (!authorization) {
      return res.status(401).json({ message: "authorization is required" });
    }
  
    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "invalid authorization format" });
    }
  
    const payload = jwt.verify(token, "y-access");
    const user = await dbService.findOne({
      model: userModel,
      filter: {
        _id: payload.userId,
      },
    });
    if (!user) {
      throw new Error("user not found", { cause: 404 });
    }
    if(!user?.isConfirmed) throw new Error('you need to be confirmed')
  
    if (user.changeCredentialsAt?.getTime() > payload.iat * 1000) {
      throw new Error("token has expired", { cause: 401 });
    }
    const ttl = await getTTL({
    key: `revoke_token::${user._id}::${payload.jti}`,
  });
  
  if (ttl > 0) {
    throw new Error("invalid revoked token, login again", { cause: 401 });
  }
    req.user = user;
    req.payload = payload;
    return next();
  }
  next();
}
