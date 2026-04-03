import express from 'express';
import { createProduct,getAllProducts,getProductbyid,deleteproductbyid,updateproductbyid } from '../controllers/productcontroller.js';
import { uploadSingle } from '../middlewares/Multer.js';
import { verifyToken } from '../middlewares/auth.js';
const routers= express.Router();

routers.post('/products', verifyToken, uploadSingle, createProduct)
routers.get('/Get/products', getAllProducts)
routers.get('/Get/products/:id', getProductbyid)
routers.delete('/Delete/products/:id', verifyToken, deleteproductbyid)
routers.put('/Update/products/:id', verifyToken, uploadSingle, updateproductbyid)



export default routers;