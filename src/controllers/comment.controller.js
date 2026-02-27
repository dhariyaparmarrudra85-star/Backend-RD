import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { apierror } from "../utils/Apierror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const {videoId} = req.params
  const {page = 1 , limit = 10} = req.query

  if(!mongoose.Types.ObjectId.isValid(videoId)){
    throw new apierror( 401 , "Invalid Video ID")
  }

  const skip = (page - 1)*limit

  const comments = await Comment.find({video : videoId})
                               .sort({createdAt : -1})
                               .skip(skip)
                               .limit(Number(limit))

  const totalComments = await Comment.countDocuments({video : videoId})

  return res.status(200)
  .json(new ApiResponse(200,{
    totalComments,
    currentPage: Number(page),
    totalPages: Math.ceil(totalComments/limit),
    comments
  }))
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const {videoId} = req.params
  const {content} = req.body

  if (!content.trim()) {
    throw new apierror( 401 , "Content is required")
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
   throw new apierror(400 , "Inbalid Video ID") 
  }

  const comment = await Comment.create(
    {
      content,
      video : videoId,
      owner : req.user?._id
    }
  )

  return res.status(200)
  .json(new ApiResponse(200,comment,"Comment Added Successfully"))
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const {commentId}= req.params
  const {content} = req.body

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new apierror(400 , "Invalid comment Id")
  }

  if (!content?.trim()) {
    throw new apierror(400 , "Content is Empty")
  }

  const comment = await Comment.findByIdAndUpdate(
    {
      _id : commentId,
      owner : req.user?._id
    },
    {
      $set:{content}
    },
    {
      new : true
    }
  )
  
  if (!comment) {
    throw new apierror( 400 , "comment not found and not authorized")
    }

    return res.status(200)
    .json(new ApiResponse(200 , comment , "comment updated successfully"))


});

const deleteComment = asyncHandler(async (req, res) => {
  
  // TODO: delete a comment
  const {commentId} = req.params

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new apierror(400 , "Invalid comment id")
  }

  const comment = await Comment.findById(commentId)

  if (!comment) {
    throw new apierror(400 , "comment not found")
  }

  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new apierror(401 , "you are not allowed to delete this comment")
  }

  await comment.deleteOne()

  return res.status(201)
  .json(new ApiResponse(201 , {} , "comment deleted successfully"))
});

export { getVideoComments, addComment, updateComment, deleteComment };
