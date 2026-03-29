import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploader = async(localfilepath) =>{
    try {   
    if(!localfilepath) return null;
   const response = await cloudinary.uploader.upload(localfilepath,{
        resource_type: 'auto',
    })
    console.log("file isuploaded on cloudinary", response.url);
    return response;
    
    } catch (error) {
        fs.unlinkSync(localfilepath);
        console.log("error while uploading file on cloudinary", error);
        return null;
    }
}
export default uploader;