import mongoose from "mongoose";

const connectDB = async () =>{
    try{
        const mongoInstance = await mongoose.connect(process.env.Mongo_URL);
        console.log("mongoDB connected at host : ",mongoInstance.connection.host);

        // console.log(process.env.MONGO_URL);
        
        
    }
    catch(error){
        console.log("error while connecting mongoDB",error);
        process.exit(1);
    }
}

export default connectDB;