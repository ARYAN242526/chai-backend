import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async(req,res) => {
  const {channelId} = req.params;
  
  if(!(channelId)){
    throw new ApiError(400, "channelId not found");
  }

  const channel = await Subscription.findById(channelId);

  if(!channel){
    throw new ApiError(400 , "Channel not found");
  }

  const subscription = await Subscription.findOne(
    {
    subscriber : req.user._id,
    channel : channelId
   },
   {new : true}
  )

  if(subscription){
    await Subscription.deleteOne(
        {
            subscriber : req.user._id,
            channel : channelId
        }
    )
  } else {
    await Subscription.create(
        {
            subscriber : req.user._id,
            channel : channelId
        }
    )
  }

  return res
           .status(200)
           .json(new ApiResponse(
            200 , {subscription} , "Subscription updated successfully"
        )
    )

})


export {toggleSubscription}