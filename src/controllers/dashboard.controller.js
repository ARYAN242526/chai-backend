import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async(req,res) => {
    // get channel stats like total video views , total subscribers , total videos , total likes etc

    const userId = req.user?._id;

    const user = await User.findById(userId);

    if(!user){
        throw new ApiError(400 , "User not found");
    }

    const channel = await User.aggregate([
        {$match: {_id: req.user?._id}},
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                totalSubscribers: {
                    $size: "$subscribers",
                },
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos : {
                    $size: "$videos",
                },
                totalViews: {
                    $sum: {
                        $map: {
                            input: "$videos",
                            as: "video",
                            in: "$$video.views"
                        },
                    },
                },
                totalLikes: {
                    $sum: {
                        $map: {
                            input: "$videos",
                            as: "video",
                            in: "$$video.likes",
                        },
                    },
                },
            },
        },
        {
            $lookup: {
                from: "tweets",
                localField: "_id",
                foreignField: "owner",
                as: "tweets"
            }
        },
        {
            $addFields: {
                totalTweets: {
                    $size: "$tweets"
                }
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "owner",
                as: "comments",
            }
        },
        {
            $addFields: {
                totalComments: {
                    $size: "$comments"
                }
            },
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
                totalVideos : 1,
                totalSubscribers: 1,
                totalViews: 1,
                totalLikes: 1,
                totalTweets: 1,
                totalComments: 1,
                coverImage: 1,
                email : 1
            },
        },
    ]);

    if(!channel.length){
        return res.status(400).json(new ApiResponse(400 , {} , "No details found"));
    }

    return res
            .status(200)
            .json(new ApiResponse(200 , channel[0] , "Channel stats fetched successfully"))

    // get total videos
    // const totalVideos = await Video.aggregate([
    //     {$match: {owner: userId}}, 
    //     {
    //         $group: {
    //             _id: null,
    //             count: {$sum : 1}
    //         }
    //     },
    //     {$sort: {count:-1}},
    // ]);

    // // get total subscribers
    // const totalSubscribers = await Subscription.aggregate([
    //     {$match: {owner: userId}},
    //     {
    //         $group: {
    //             _id: "$channel",
    //             count: {$sum:1}
    //         }
    //     },
    //     {$sort: {count: -1}}
    // ]);

    // // get total likes
    // const totalLikes = await Like.aggregate([
    //     {$match: {LikedBy: userId}},
    //     {
    //         $group : {
    //             _id: null,
    //             count: {$sum : 1}
    //         }
    //     },
    //     {$sort: {count: -1}}
    // ]);

    // // get total views
    // const totalViews = await Video.aggregate([
    //     {$match : {owner: userId}},
    //     {
    //         $group: {
    //             _id: "$views",
    //             count: {$sum: 1}
    //         }
    //     },
    //     {$sort: {count: -1}}
    // ]);

    // // get total comments
    // const totalComments = await Comment.aggregate([
    //     {$match: {owner: userId}},
    //     {
    //         $group: {
    //             _id: null,
    //             count: {$sum: 1}
    //         }
    //     },
    //     {$sort: {count: -1}}
    // ]);

    // // get total tweets
    // const totalTweets = await Tweet.aggregate([
    //     {$match: {owner: userId}},
    //     {
    //         $group: {
    //             _id: null,
    //             count: {$sum: 1}
    //         }
    //     },
    //     {$sort: {count: -1}}
    // ]);

    // return res.status(200).json(
    //     new ApiResponse(200 , {
    //         totalVideos,
    //         totalSubscribers,
    //         totalViews,
    //         totalLikes,
    //         totalComments,
    //         totalTweets
    //     }, "Channel stats fetched successfully"
    //     )
    // )
});

const getChannelVideos = asyncHandler(async(req,res) => {
    const user = await User.findById(req.user?._id);

    if(!user){
        throw new ApiError(400 , "User not found");
    }

    const videos = await Video.aggregate([
        {
            $match: {
            owner: req.user?._id,
            isPublished: true,
            }
        },
        {
            $sort: {
                creeatedAt: -1,
            }
        },
        {
            $project: {
                videoFile: 1, 
                thumbnail: 1,
                title: 1,
                description: 1,
                views: 1,
                duration: 1,
            }
        },
    ]);

    if(!videos.length){
        return res.status(400).json(new ApiResponse(400 , {} , "Channel videos not found"));
    }

    return res
            .status(200)
            .json(new ApiResponse(200 , videos , "Channel videos fetched successfully"))
})

export {getChannelStats , getChannelVideos}
