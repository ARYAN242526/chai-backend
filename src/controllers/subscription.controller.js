import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const toggleSubscription = asyncHandler(async(req,res) => {
  const {channelId} = req.params;
  
  if(!channelId){
    throw new ApiError(400, "channelId not found");
  }

  const channel = await User.findById(channelId);

  if(!channel){
    throw new ApiError(400 , "Channel not found");
  }

  const subscription = await Subscription.findOne(
    {
    subscriber : req.user._id,
    channel : channelId
   },
   {new : true}
  );

  let message;

  if(subscription){
    await Subscription.deleteOne(
        {
            subscriber : req.user._id,
            channel : channelId
        }
    );
    message = "Unsubscribed successfully";
  } else {
    await Subscription.create(
        {
            subscriber : req.user._id,
            channel : channelId
        }
    );
    message = "Subscribed successfully";
  }

  return res
           .status(200)
           .json(new ApiResponse(200 , {subscribed : !subscription} ,  message));

})

const getUserChannelSubscribers = asyncHandler(async(req,res) => {
  const {channelId} = req.params;

  if(!channelId || !isValidObjectId(channelId)){
    throw new ApiError(400 , "Valid Channel Id is required");
  }


  const subscribers = await Subscription.aggregate([
    {
      $match : { channel : new mongoose.Types.ObjectId(channelId)},
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField:"_id",
        as: "subscriberDetails",
      },
    },
    {
      $unwind: "$subscriberDetails",
    },
    {
      $project: {
        _id: 1,
        "subscriberDetails._id" : 1,
        "subscriberDetails.username" : 1,
        "subscriberDetails.email" : 1,
      },
    },
  ]);

  // const channelSubs = await Subscription.find({
  //   channel: channelId,
  // }).populate("subscriber","_id name email");

  // if(!channelSubs || channelSubs.length === 0){
  //   throw new ApiError(400 , "Channel subs not found or empty");
  // }

  if(!subscribers || subscribers.length === 0){
    throw new ApiError(400 , "No subscribers found for this channel");
  }

  return res
            .status(200)
            .json(new ApiResponse(200 , subscribers , "Channel subscribers retrieved successfully"));
});

const getSubscribedChannels = asyncHandler(async(req,res) => {
      const {subscriberId} = req.params;

      if(!subscriberId || !isValidObjectId(subscriberId)){
        throw new ApiError(400 , "Valid subscriber Id is required")
      }

      const subscribedChannels = await Subscription.aggregate([
        {
          $match: {subscriber: new mongoose.Types.ObjectId(subscriberId)},
        },
        {
          $lookup: {
            from: "users",
            localField: "channel",
            foreignField: "_id",
            as: "channelDetails",
          }
        },
        {
          $unwind : "$channelDetails",
        },
        {
          $project: {
            _id: 1,
            "channelDetails._id": 1,
            "channelDetails.username": 1,
            "channelDetails.email": 1,
          },
        },
      ]);

      if(!subscribedChannels || subscribedChannels.length === 0){
        throw new ApiError(400 , "User not subscribed to any channels");
      }

      return res.
                status(200)
                .json(new ApiResponse(200 , subscribedChannels , " Subscribed channels retrieved successfully"));
})


export {toggleSubscription , getUserChannelSubscribers , getSubscribedChannels}