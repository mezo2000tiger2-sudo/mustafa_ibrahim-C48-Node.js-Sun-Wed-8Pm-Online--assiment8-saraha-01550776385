import { v2 as cloudinary } from "cloudinary";
import { CLOUDINRAY_API_KEY, CLOUDINRAY_API_SECRET } from "../../../../config/config.service.js";

cloudinary.config({
    api_key:CLOUDINRAY_API_KEY,
    api_secret:CLOUDINRAY_API_SECRET,
    cloud_name:'h9s7dtis'
})

export default cloudinary