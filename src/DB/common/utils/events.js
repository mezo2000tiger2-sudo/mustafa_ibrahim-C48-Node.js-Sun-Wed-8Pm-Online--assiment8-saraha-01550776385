import { EventEmitter } from "node:events";
export const eventEmitter = new EventEmitter()

eventEmitter.on('Confirm_email',async(fn)=>{
    fn()
})