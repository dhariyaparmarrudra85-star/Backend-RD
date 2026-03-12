import { mongoose, isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { apierror } from "../utils/Apierror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new apierror(400, "Invalid ChannelId");
  }

  const channelStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: { $size: "$likes" } },
        totalSubscribers: { $first: { $size: "$subscribers" } },
      },
    },
    {
      $project: {
        _id: 0,
        totalVideos: 1,
        totalViews: 1,
        totalLikes: 1,
        totalSubscribers: 1,
      },
    },
  ]);

  const channelInfo = await User.findById(channelId).select(
    "username fullName avatar coverImage"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { channelStats, channelInfo },
        "channel stats fetched successfully"
      )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const { channelId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  if (!isValidObjectId(channelId)) {
    throw new apierror(400, "Invalid channelId");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new apierror(404, "channel not found");
  }

  const aggregateQuery = Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
        isPublished: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $arrayElemAt: ["$owner", 0] },
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        thumbnail: 1,
        videoFile: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        owner: 1,
        likesCount: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    customLabels: {
      totalDocs: "totalVideos",
      docs: "videos",
    },
  };

  const result = await Video.aggregatePaginate(aggregateQuery, options);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
