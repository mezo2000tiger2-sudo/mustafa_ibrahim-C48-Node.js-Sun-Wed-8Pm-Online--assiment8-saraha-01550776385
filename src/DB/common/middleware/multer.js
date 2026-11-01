import multer  from "multer"
import {randomUUID} from "crypto"
import fs from "node:fs"
import cloudinary from "../utils/cloudinary.js"
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

export function multerCloud({ customStorage = "general", customTypes = [] } = {}) {
  const folder = `sahara/uploads/${customStorage}`
  const storage = {
    _handleFile(req, file, cb) {

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return cb(error)
          cb(null, {
            path: result.secure_url,
            filename: result.public_id,
            size: result.bytes,
            resource_type: result.resource_type,
          })
        }
      )

      file.stream.pipe(uploadStream)
    },

    _removeFile(req, file, cb) {
      cloudinary.uploader.destroy(
        file.filename,
        { resource_type: file.resource_type || "image" },
        (error) => cb(error)
      )
    },
  }

  function fileFilter(req, file, cb) {
    if (!customTypes.includes(file.mimetype)) {
      return cb(new Error("inValid file!"))
    }
    cb(null, true)
  }

  return multer({ storage, fileFilter })
}

