import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import { apierror } from "../utils/Apierror.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
        throw new apierror(400 , "Invalid videoID")
    }

    const existingLike = await Like.findOne({
        video:new mongoose.Types.ObjectId(videoId),
        likedBy:req.user?._id
    })
console.log(existingLike)
console.log(videoId);
console.log(req.user?._id);


    if (existingLike) {
        await Like.deleteOne({
        video:new mongoose.Types.ObjectId(videoId),
        likedBy:req.user._id
    })
        return res.status(200)
        .json(new ApiResponse(
            200,
            {},
            "Video Unliked successfully"
        ))
    }

    await Like.create({
        video:new mongoose.Types.ObjectId(videoId),
        likedBy:req.user._id
    })

    return res.status(200)
    .json(new ApiResponse(
        200,
        {},
        "Video liked successfully"
    ))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new apierror(400 , "Invalid commentID")
    }

    const existingLike = await Like.findOne({
        comment:new mongoose.Types.ObjectId(commentId),
        likedBy:req.user._id
    })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200)
        .json(new ApiResponse(
                200,
                {},
                "comment unliked Successfully"
            ))
    }

    await Like.create({
        comment:new mongoose.Types.ObjectId(commentId),
        likedBy:req.user._id
    })

    return res.status(200)
    .json(new ApiResponse(
        200,
        {},
        "comment liked successfully"
    ))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new apierror(400 , "Invalid TweetID")
    }

    const existingLike = await Like.findOne({
        tweet:new mongoose.Types.ObjectId(tweetId),
        likedBy:req.user._id
    })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200)
        .json(new ApiResponse(
            200,
            {},
            "tweet unliked successfully"
        ))
    }

    await Like.create({
        tweet:new mongoose.Types.ObjectId(tweetId),
        likedBy:req.user._id
    })

    return res.status(200)
    .json(new ApiResponse(
        200,
        {},
        "tweet liked successfully"
    ))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: {$ne:null}
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video"
            }
        },
        {
            $unwind:"$video"
        },
        {
            $project:{
                _id:0,
                video:1
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(
        200,
        likedVideos,
        "successfully get all liked videos"
    ))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}