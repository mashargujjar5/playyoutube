import mongoose from 'mongoose';
import { Schema } from 'mongoose'

const productSchema = new Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    image:{
        type:String,
        required:true
    }
    

    
},{timestamps:true})
const Product = mongoose.model('Product', productSchema);
export default Product;