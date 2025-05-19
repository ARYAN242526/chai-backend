import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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



export {addComment , updateComment , deleteComment}