import express from 'express';


const Registeruser= (req,res)=>{
  res.status(200).json({
        success:true,
        message:"ssss registered successfully"
    })
}
export default  Registeruser