import multer  from "multer"
import {randomUUID} from "crypto"
import fs from "node:fs"

export function multerLocal(customStorage) {
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


const upload = multer({ storage })
return upload
}

