import { compareSync, hashSync } from "bcrypt"

export const Hash =async (plainText,Salt_Rounds =12)=>{
    return hashSync(plainText,Salt_Rounds)
}
export const Compare =async (plainText,cipherText)=>{
    return compareSync(plainText ,cipherText)
}