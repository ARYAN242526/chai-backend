import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query;
    const userId = req.user._id;

    const skip = (page - 1) * limit;

    const videoComments = await Comment.aggregate([
        {
            $match : {
                video : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "ownerDetails",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            avatar : 1
                        }
                    }
                ]
            }
        },
        {
            $addFields : {
                commenterOfVideo : {
                 $first : "$ownerDetails"
                }
            }
        },
        { $sort : {createdAt : -1} },
        { $skip : skip},
        {$limit : parseInt(limit)},
        {
            $project : {
                commenterOfVideo : 1,
                content : 1,
                owner : 1
            }
        }
    ])

    if(!videoComments || videoComments.length === 0){
        throw new ApiError(404, "Video comments not found")
    }

    return res
             .status(200)
             .json(new ApiResponse(200, videoComments ,"Video Comments found successfully"))
})


const addComment = asyncHandler(async(req,res) => {
    const {videoId} = req.params;
    const {content} = req.body;

    if(!videoId  && !content){
        throw new ApiError(400 , "Video Id and content are required")
    }
   
    const comment = await Comment.create({
        content : req.body.content,
        video : videoId,
        owner : req.user?._id
    })

    if(!comment){
        throw new ApiError(400 , "Error while creating comment")
    }

    return res
             .status(200)
             .json(new ApiResponse(200 , comment , "Comment created successfully"))

})

const updateComment = asyncHandler(async(req,res) => {
    const {commentId} = req.params;

    if(!commentId){
        throw new ApiError(400 , "Comment id is required")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId , 
        {
            $set : {
                content : req.body.content
            }
        },
        {new : true}
    )

    if(!updatedComment){
        throw new ApiError(400 , "Error while updating your comment")
    }

    return res.
              status(200).
              json(new ApiResponse(200 , updatedComment , "Comment updated successfully"))
})

const deleteComment = asyncHandler(async(req,res) => {
    const {commentId} = req.params;

    if(!commentId){
        throw new ApiError(400 , "Comment Id not found");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if(!deletedComment){
        throw new ApiError(400 , "Error while deleting comment")
    }

    return res
             .status(200)
             .json(new ApiResponse(200 , {} , "Comment deleted successfully"))
})



export {addComment , updateComment , deleteComment, getVideoComments}