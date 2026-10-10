import multer  from "multer"
import {randomUUID} from "crypto"
import fs from "node:fs"

export function multerLocal({customStorage ='general' , customTypes =[]}) {
    if(!fs.existsSync(`uploads/${customStorage}`)) {
        fs.mkdirSync(`uploads/${customStorage}`, { recursive: true });
    }
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, `uploads/${customStorage}`)
      },
      filename: function (req, file, cb) {
          cb(null, `${randomUUID()}-${file.originalname}`)
      }
    })



  function fileFilter (req, file, cb) {
    if(!customTypes.includes(file.mimetype)) {
        cb(new Error('inValid file!'))
    }
    cb(null, true)
  }


const upload = multer({ storage, fileFilter })
return upload
}

