export function authorization(roles = []) {
    return async function (req, res, next) {
        if(!roles.includes(req.user.role)){
            throw new Error('unauthorized',{cause:403})
        }
        next()
    }
}