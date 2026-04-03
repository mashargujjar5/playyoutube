import { createProductService,getAllProductsService,getProductByIdService,deleteProductService,updateProductService } from '../service/productService.js';

const createProduct = async (req, res) => {
    try {
        const { title, description, price } = req.body;
        const image = req.file.path;
        if (!title || !description || !price || !image) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const product = await createProductService(title, description, price, image);
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getAllProducts = async (req, res) => {
    try{
       const products = await getAllProductsService();
       res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });

    }
};
const getProductbyid= async(req,res)=>{
    try{
        const id = req.params.id;
        console.log(id);
        const product = await getProductByIdService(id);
        if(!product){
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    }
    catch(error){
        res.status(500).json({ message: error.message });
    }
}
const deleteproductbyid=async(req,res)=>{
    try{
        const id = req.params.id;
        console.log("delete Product id", id);
        const product = await deleteProductService(id);
        if(!product){
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully',productdetails: product });
    }
    catch(error){
        console.log('error',error);
        throw error;
        
    }
}
const updateproductbyid=async(req,res)=>{
    try{
        const id = req.params.id;
        const { title, description, price } = req.body;
        const image = req.file ? req.file.path : undefined;
        const product = await updateProductService(id, title, description, price, image);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
export { createProduct, getAllProducts,getProductbyid,deleteproductbyid,updateproductbyid };