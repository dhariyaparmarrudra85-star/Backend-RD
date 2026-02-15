import { json } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apierror } from "../utils/Apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnaray.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"



const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
     if (!user) {
      throw new apierror(404, "User not found");
    }
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();
    
    user.refreshToken = refreshToken;
    
    await user.save({ validateBeforeSave: false });
     return {accessToken , refreshToken}
  } catch (error) {
     console.error("TOKEN ERROR 👉", error);
     throw error;
  }

 
};

// Registration

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  // console.log("email :", email);

  if (
    [fullName, username, password, email].some((field) => field?.trim() === "")
  ) {
    throw new apierror(400, "All field are compulsary to fill");
  }

  const usernameLower = username.toLowerCase();
  const usernameExists = await User.findOne({ username: usernameLower });

  if (usernameExists) {
    throw new apierror(409, "Username Alredy Existed");
  }
  const emailExists = await User.findOne({ email });

  if (emailExists) {
    throw new apierror(409, "Email Alredy Existed");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // console.log(avatarLocalPath);
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  // console.log(coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new apierror(400, "Avtara is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new apierror(400, "Avatar upload failed");
  }

  const avatarUrl = avatar.secure_url;

  if (!avatarUrl) {
    throw new apierror(401, "Avatar URL missing");
  }

  let coverImage;
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  const user = await User.create({
    fullName,
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url || "",
    username: username.toLowerCase(),
    password,
    email,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new apierror(500, "Something went wrong while registering User");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

// Login User

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new apierror(400, "enter username or email");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new apierror(404, "user doen't exist");
  }

  const isPasswordvalid = await user.isPasswordCorrect(password);

  if (!isPasswordvalid) {
    throw new apierror(401, "password incorrect");
  }

  const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)

  const loggeduser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  const option = {
    httpOnly :true,
    secure : true
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,option)
  .cookie("refreshToken",refreshToken,option)
  .json(
    new ApiResponse(
      200,
      {
        loggeduser , accessToken, refreshToken
      },
      "user logged in Successfully"
    )
  )
});

// Logout User

const logoutUser = asyncHandler( async(req , res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken: undefined
      },
      new : true
    }
  )
   const option = {
    httpOnly :true,
    secure : true
  }
  return res
  .status(200)
  .clearCookie("accessToken" , option)
  .clearCookie("refreshToken" , option)
  .json(
    new ApiResponse(200,{},"User Logged Out")
  )
})

// newAccessToken

const refreshAccessToken = asyncHandler(async(req , res) =>{
 const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken
 
 if(!incomingRefreshToken){
  throw new apierror( 401 , "Unauthorized request")
 }
 try {
  const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
  
  if(!decodedToken){
   throw new apierror(401 , "We can't get DecodedToken")
  }
 
  const user = await User.findById(decodedToken?._id)
 
  if(!user){
   throw new apierror( 401 , "Invalid RefreshToken")
  }
   
  if(incomingRefreshToken !== user?.refreshToken){
   throw new apierror(401 , "Your refreshToken Expired or used")
  }
 
  const options = {
   httpOnly:true,
   secure:true
  }
  const {accessToken , newRefreshToken} =  await generateAccessAndRefreshToken(user._id)
 return res
         .status(200)
         .cookie("accessToken" , accessToken ,options)
         .cookie("refreshToken",newRefreshToken,options)
         .json(
           new ApiResponse(
             200,
             {accessToken , newRefreshToken},
             "Access Token generated SuccessFully"
           )
         )
 
 } catch (error) {
  throw new apierror( 401 , error?.message || "RefreshToken Invalid")
 }
})


export { registerUser, loginUser , logoutUser , refreshAccessToken};
