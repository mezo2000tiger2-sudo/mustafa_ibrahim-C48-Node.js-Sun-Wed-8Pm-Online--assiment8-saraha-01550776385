import { compareSync, hashSync } from "bcrypt"

export const Hash = (plainText,Salt_Rounds =12)=>{
    return hashSync(plainText,Salt_Rounds)
}
export const Compare = (plainText,cipherText)=>{
    return compareSync(plainText ,cipherText)
}