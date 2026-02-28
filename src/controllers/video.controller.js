import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import { apierror } from "../utils/Apierror.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy="createdAt", sortType="desc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const matchSatge = {
        isPublished:true
    }

    if (query) {
        matchSatge.$or=[
            {title :{ $regex:query , $options:"i"}},
            {description : {$regex:query , $options:"i"}}
        ]
    }

    if (userId && isValidObjectId(userId)) {
        matchSatge.owner = new mongoose.Types.ObjectId(userId)
    }

    const aggregate = Video.aggregate([
        {
            $match: matchSatge
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $unwind:"$owner"
        },
        {
            $project:{
                videoFile:1,
                thumbnail:1,
                title:1,
                description:1,
                duration:1,
                views:1,
                isPublished:1,
                createdAt:1,
                "owner.username":1,
                "owner.Avatar":1

            }
        },
        {
            $sort:{
                [sortBy]:sortType === "asc" ? 1:-1
            }
        }
    ])

    const options = {
        page:Number(page),
        limit:Number(limit)

    }
    

    const videos = await Video.aggregatePaginate(aggregate,options)

    return res.status(200)
    .json(new ApiResponse(200 , videos , "video fetched successfully" ))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description ,duration} = req.body
    // TODO: get video, upload to cloudinary, create video
    if (!title || !description || !duration) {
        throw new apierror(400 , "All fields are required  ")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new apierror(401 , "Video File and Thumbnil File is required")
    }
    
    const videoUpload = await uploadOnCloudinary(videoLocalPath)
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoUpload || !thumbnailUpload) {
        throw new apierror(401 , "File upload failed")
    }

    const video = await Video.create({
        title,
        description,
        duration,
        videoFile:videoUpload.url,
        thumbnail:thumbnailUpload.url,
        owner:req.user?._id
    })

    return res.status(201)
    .json(new ApiResponse(
        201,
        video,
        "Video Uploaded Successfully"
    ))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new apierror(401 , "Invalid Video ID")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $inc:{views:1}    /*increase views*/
        },
        {
            new:true
        }
    ).populate("owner","username avatar")

    if (!video) {
        throw new apierror(401,"video not found")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        video,
        "Video fetched successfully"
    ))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    //TODO: update video details like title, description, thumbnail
    if (!isValidObjectId(videoId)) {
        throw new apierror(400 , "Invalid Video Id")
    }

    const video = await Video.findById(videoId)

    if(!video){
      throw new apierror(401 , "Video Not Found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new apierror( 400 , "Unauthorized")
    }
    
    if(title) video.title = title
    if(description) video.description = description

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path
    if (thumbnailLocalPath) {
        const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)
        video.thumbnail = thumbnailUpload.url
    }

    await video.svae()

    return res.status(200)
    .json(
        new ApiResponse(200,video,"video updated successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new apierror( 401 , "Invalid video Id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new apierror( 401 , "Video Not Found")
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new apierror(402 , "Unauthorized")
    }

    await video.deleteOne()

    return res.status(201)
    .json(new ApiResponse(
        201,
        {},
        "Video Deleted Successfully"
    ))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new apierror( 400 , "Innvalid videoID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new apierror( 404 , "Video Not Found")
    }

    if (video.owner.toString() !== rea.user?._id.toString()) {
        throw new apierror( 401 , "unauthorized")
    }

    video.isPublished = !video.isPublished

    video.save()

    return res.status(200)
    .json(new ApiResponse(
        200,
        video,
        "Video Published Successfully"
    ))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}