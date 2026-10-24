import { getValues, incr, setValue } from "../../service/redis.service.js";
import * as dbService from "../../service/db.service.js";
import { generat_otp, sendEmail } from "../../../service/sendEmail.js";
import { Hash } from "../../common/security/hash.js";
import { eventEmitter } from "../../common/utils/events.js";
import userModel from "../../models/user.model.js";
import { emailTemplate } from "../../common/utils/email.template.js";

export async function SendEmailOtp({email ,isConfirmed , subject}) {
  const [[isBlocked_ttl, otpTTl, otpMax], user] = await Promise.all([
    getValues([
      { key:`otp::block::${email}`, type:'ttl' },
      { key:`otp::${email}`, type:'ttl' },
      { key:`otp::max::${email}` }
    ]),
    dbService.findOne({
      model:userModel,
      filter:{
        email,
        isConfirmed:{$exists:isConfirmed}
      }
    })
  ])
  if(isBlocked_ttl > 0){
    throw new Error(`you are blocked , you can retry after ${isBlocked_ttl}`)
  }

  if(otpTTl > 0) throw new Error(`you can send otp after ${otpTTl}`)

  if(otpMax >=3) {
    await setValue({
      key:`otp::block::${email}`,
      value:'1',
      ttl:60 *10
    })
    throw new Error('you have reached your maximum number of tries')
  }

  if(!user)throw new Error ('user not exist or already confirmed')
  const otp = generat_otp()
  const otpHash =Hash(otp)
  if(otpMax === null){
    await setValue({
      key:`otp::max::${email}`,
      value:0,
      ttl:60 * 5
    })
  }
  await setValue({
    key:`otp::${email}`,
    value:otpHash,
    ttl: 60 * 2
  })
  await incr(`otp::max::${email}`)
  
  eventEmitter.emit('Confirm_email',()=>{
    return sendEmail({
      subject,
      to: email,
      html:emailTemplate({otp}),
  })
  })
}
