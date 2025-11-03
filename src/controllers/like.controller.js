import mongoose , {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";


const toggleVideoLike = asyncHandler(async(req ,res) => {
    const {videoId} = req.params;

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400 , "Valid videoId is required");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400 , "Video not found");
    }

    // check if the video is already liked
    const alreadyLiked = await Like.findOne({
        likedBy: req.user._id,
        video: videoId
    });

    if(alreadyLiked){
        await Like.deleteOne(alreadyLiked);

        return res
                .status(200)
                .json(new ApiResponse(200 , {} , "video like removed"));
    }

    const likeDoc = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    res.status(200)
        .json(new ApiResponse(200 , likeDoc , "Video like added"));
});

const toggleCommentLike = asyncHandler(async(req,res) => {
    const {commentId} = req.params;

    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400 , "Valid comment Id is required");
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400 , "Comment not found");
    }

    const alreadyLiked = await Like.findOne({
        likedBy: req.user._id,
        comment: commentId,
    });

    if(alreadyLiked){
        await Comment.deleteOne(alreadyLiked);

        return res
                .status(200)
                .json(new ApiResponse(200 , {} , 'comment like removed'));
    }

    const likeDoc = await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })

    res.status(200).json(new ApiResponse(200 , likeDoc , "Comment like added"));
});

const toggleTweetLike = asyncHandler(async(req,res) => {
    const {tweetId} = req.params;

    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400 , "Valid tweet Id is required");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(400 , "Tweet not found");
    }

    const alreadyLiked = await Like.findOne({
        likedBy: req.user._id,
        tweet: tweetId,
    });

    if(alreadyLiked){
        await Tweet.deleteOne(alreadyLiked);

        return res
                .status(200)
                .json(new ApiResponse(200 , {} , 'tweet like removed'));
    }

    const likeDoc = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    res.status(200).json(new ApiResponse(200 , likeDoc , "tweet like added"));
})


export {toggleVideoLike , toggleCommentLike , toggleTweetLike}



