import mongoose, {isValidObjectId} from "mongoose";
import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async(req,res) => {
    const {content} = req.body;

    if(!content || content.trim() === ''){
        throw new ApiError(400, 'Content is required')
    }

    const tweet = await Tweet.create({
        content,
        owner : req.user?._id,
    })


    if(!tweet){
        throw new ApiError(400 , 'Error while creating tweet')
    }

    return res
    .status(201)
    .json(new ApiResponse(201,tweet , 'Tweet created successfully'))
})

const getUserTweets = asyncHandler(async(req,res) => {
    const userId = req.params?.userId;

   if(!userId){
    throw new ApiError(400, 'Invalid user Id')
   }

   const user = await User.findById(userId);
   if(!user){
    throw new ApiError(400, 'User not found')
   }

   const tweets = await Tweet.find({owner : userId})

   if(!tweets){
    throw new ApiError(400, 'Error while fetching user tweets')
   }

   return res
   .status(200)
   .json(new ApiResponse(200, tweets, 'User tweets fetched successfully'))

    

})

const updateTweet = asyncHandler(async(req,res) => {
    const {tweetId} = req.params;
    const {updatedContent} = req.body;

    if(!tweetId || !updatedContent){
        throw new ApiError(400 , 'All fields are required')
    }

    const tweet = await Tweet.findById(tweetId);

    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400 , ' You are not authorized to update tweet')
    }


    const response = await Tweet.findByIdAndUpdate(tweetId,
        {$set : {content : updatedContent}},
        {new : true}
    )

    if(!response){
        throw new ApiError(400 , 'Unable to update tweet')
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,'Tweet updated successfully'))
})

const deleteTweet = asyncHandler(async(req,res) => {
    const user = await User.findById(req.user._id);
    const tweet = await Tweet.findById(req.params.tweetId)

    if(user._id.toString() !== tweet.owner.toString()){
        throw new ApiError(400 , 'You are not authorized to delete this tweet')
    }
    await Tweet.findByIdAndDelete(req.params.tweetId);

    return res
    .status(200)
    .json(new ApiResponse(200 , {}, 'Tweet deleted successfully'))
})


export {createTweet,getUserTweets,updateTweet,deleteTweet}