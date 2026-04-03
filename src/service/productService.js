import Product from '../models/product.js';
import uploader from '../utils/Cloudinary.js';

const createProductService = async (title, description, price, imagePath) => {
    const imageUrl = await uploader(imagePath);
    const product = await Product.create({
        title,
        description,
        price,
        image: imageUrl.url
    });
        console.log("Product created:", product);

    return product;
};
const getAllProductsService = async () => {
    const products = await Product.find();
    console.log("Products retrieved:", products);
    const returnwithoutid = products.map(product => {
        const { _id, ...rest } = product.toObject();
        return rest;
    });
    return returnwithoutid;
}
const getProductByIdService = async (id) => {
    const product = await Product.findById(id);
    console.log("Product retrieved:", product);
    
    return product;
};
const deleteProductService = async (id) => {
    try{
      const product =  await Product.findByIdAndDelete(id);
        console.log("Product deleted:", id," Product details:", product);
        return product;
    } catch(error){
        console.error("Error deleting product:", error);
        throw error;
    }
}
const updateProductService = async (id, title, description, price, imagePath) => {
    const imageUrl = await uploader(imagePath);
    const product = await Product.findByIdAndUpdate(id, {
        title,
        description,
        price,
        image: imageUrl.url
    }, { new: true });
    console.log("Product updated:", product);
    return product;
};


export { createProductService,getAllProductsService,getProductByIdService,deleteProductService,updateProductService };