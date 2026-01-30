import { configDotenv } from "dotenv";
import connectDB from "./db/index.js";

configDotenv({
  path:['./env','.env.local','.env']
})

connectDB()
.then(()=>{
  app.on("error",(error)=>{
      console.log("ERROR while listen app:",error);
      
    })
  app.listen(process.env.PORT || 8000, ()=>{
    console.log(` serevr is running on port : ${process.env.PORT}`);
    
  })
})
.catch((err)=>{
   console.log("DB connection failed :",err);
   
})





















// import express from "express"
// const app = express()

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//     app.on("error",(error)=>{
//       console.log("ERROR:",error);
      
//     })
//     app.listen(process.env.PORT,()=>{
//       console.log(`App listieng on port ${process.env.PORT}`);
      
//     })
//   } catch (error) {
//     console.log("Error in DB is :",error);
    
//   }

// })()