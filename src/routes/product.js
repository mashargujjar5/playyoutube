import express from 'express';
import { createProduct,getAllProducts,getProductbyid,deleteproductbyid,updateproductbyid } from '../controllers/productcontroller.js';
import { uploadSingle } from '../middlewares/Multer.js';
const routers= express.Router();

routers.post('/products', uploadSingle, createProduct)
routers.get('/Get/products', getAllProducts)
routers.get('/Get/products/:id', getProductbyid)
routers.delete('/Delete/products/:id', deleteproductbyid)
routers.put('/Update/products/:id', uploadSingle, updateproductbyid)



export default routers;