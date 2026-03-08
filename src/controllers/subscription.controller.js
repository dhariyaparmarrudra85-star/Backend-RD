import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { apierror } from "../utils/Apierror.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new apierror(400 , "invalid channelId")
    }

    if(channelId === req.user._id.toString()){
    throw new apierror(400,"You cannot subscribe to your own channel")
}

    const existingSubscriber = await Subscription.findOne({
        subscriber : req.user._id,
        channel :channelId 
    })

    if (existingSubscriber) {
        await Subscription.deleteOne({
            subscriber : req.user._id,
            channel :channelId
        })

        return res.status(200)
        .json(new ApiResponse(
            200,
            {},
            "channel unsubscribed"
        ))
    }

    const subscription = await Subscription.create({
        subscriber:req.user._id,
        channel:channelId
    })

    return res.status(200)
    .json(new ApiResponse(
        200,
        subscription,
        "subscribed successfully"
    ))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!channelId) {
        throw new apierror( 400 , "Invalid channelID")
    }

    const subscriber = await Subscription.aggregate([
        {
            $match:{
                channel :new mongoose.Types.ObjectId(channelId) 
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriberDetails"
            }
        },
        {
            $unwind:"$subscriberDetails"
        },
        {
            $project:{
                _id:0,
                subscriberId:"$subscriberDetails._id",
                username:"$subscriberDetails.username",
                avatar:"$subscriberDetails.avatar"

            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(
        200,
        subscriber,
        "subscribers Fetched Successfully"
    ))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new apierror(400 , "invalid subscriberId")
    }

    const getSubscribedChannel = await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriberId)
            }
        },{
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedChannels"
            }
        },{
            $unwind:"$subscribedChannels"
        },
        {
            $project:{
                    _id:0,
                    channelId:"$subscribedChannels._id",
                    username:"$subscribedChannels.username",
                    avatar:"$subscribedChannels.avatar",
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(
        200,
        getSubscribedChannel,
        "subscribed user channel fetched"
    ))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}