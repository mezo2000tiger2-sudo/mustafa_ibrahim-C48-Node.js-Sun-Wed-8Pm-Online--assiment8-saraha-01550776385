import joi from "joi"
export function validation(schema){
    return (req,res,next)=>{
        const erroResult=[]
        for (const key of Object.keys(schema)) {
            const { error } =schema[key].validate(req[key],{abortEarly:false}) 
            if(error){
                error.details.forEach(error=>{
                    erroResult.push({
                        message:error.message,
                        path:error.path[0],
                        key
                    })
                })
            }
        }
        if (erroResult.length > 0) {
            const err = new Error("Validation failed");
            err.cause = 400;
            err.details = erroResult;
            return next(err);
        }
        next()
    }
}