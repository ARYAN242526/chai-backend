import mongoose , {isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary , deleteFromCloudinary } from "../utils/cloudinary.js";



const publishAVideo = asyncHandler(async(req,res) => {
    const {title , description} = req.body;
    
    if(!title && !description){
        throw new ApiError(400, 'Title and description both are needed')
    }

    const videoFilePath = req.files?.videoFile[0]?.path;
    const thumbNailFilePath = req.files?.thumbnail[0]?.path;

    // console.log("VideoLocalPath : " , videoFilePath);
    // console.log("ThumbNailLocalPath : " , thumbNailFilePath);

    if(!videoFilePath && !thumbNailFilePath){
        throw new ApiError(400 , 'Both video and thumbnail file path needed');
    }

    const cloudinaryVideoLink = await uploadOnCloudinary(videoFilePath);
    const cloudinaryThumbnailLink = await uploadOnCloudinary(thumbNailFilePath)

    // console.log("CloudinaryVideoLink" , cloudinaryVideoLink);
    // console.log("CloudinaryThymbnailLink" , cloudinaryThumbnailLink);

    const video = await Video.create({
        videoFile : cloudinaryVideoLink.url,
        thumbnail : cloudinaryThumbnailLink.url,
        title,
        description,
        owner : req.user,
        duration : cloudinaryVideoLink.duration
    })

    if(!video){
        throw new ApiError(400 , 'Error while creating video')
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , video ,  'Video created successfully'))
    
})

const getVideoById = asyncHandler(async (req,res) => {
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)) throw new ApiError(400 , 'Invalid VideoId')

    if(!videoId){
        throw new ApiError(400 , 'Video ID is required')
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400 , 'Error whie fetching video')
    }

    return res
    .status(200)
    .json(new ApiResponse(200 , video , 'Video Fetched Successfully'))
})

const updateVideo = asyncHandler(async(req,res) => {
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid videoId")
    }

    const {title , description} = req.body;
   const thumbnailPath = req.file?.path;

   if(!title || !description || !thumbnailPath){
    throw new ApiError(400 , "All fields are required")
   }

   const thumbnail = await uploadOnCloudinary(thumbnailPath);
   if(!thumbnail){
    throw new ApiError(400 , "Error while uploading thumbnail")
   }

   const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
     {
        $set : {
            title : title,
            description : description,
            thumbnail : thumbnail.url
        }
     },
     { new : true}
   )

   if(!updatedVideo){
    throw new ApiError(400, "Error while updating video")
   }

   return res
            .status(200)
            .json(new ApiResponse(200 , updatedVideo , "Video updated successfully"))

})

const deleteVideo = asyncHandler(async(req,res) => {
    const {videoId} = req.params;

    if(!videoId) {
        throw new ApiError(400 , "Video ID is required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid videoId")
    }


    const video =  await Video.findById(videoId);
    if(!video){
        throw new ApiError(400 , "Video not found")
    }

    // check if user is authorized to delete the video
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400 , "You are not authorized to delete this video")
    }

    // delete video and thumbnail before deleting the video
   try {
        const videoFilePublicId = video?.videoFile?.split("/").pop().split(".")[0];
        const thumbnailPublicId = video?.thumbnail?.split("/").pop().split(".")[0];

        const videoFileDeletefromCloud = await deleteFromCloudinary(videoFilePublicId);
        
        const thumbnailDeletefromCloud = await deleteFromCloudinary(thumbnailPublicId);
        
        console.log("Video file   deleted from the cloudinary...",videoFileDeletefromCloud);
        console.log("Thumbnail deleted from cloudinary" , thumbnailDeletefromCloud);
        
    } catch (error) {
        console.log("Error in deleting video from cloudinary", error);
        throw new ApiError(500, "Internal server error");
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if(!deletedVideo){
        throw new ApiError(400 , "Error while deleting video")
    }

    return res.status(200).json( new ApiResponse(200 , {} , "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async(req,res) => {
    const {videoId} = req.params;

    if(!videoId) throw new ApiError(400 , "VideoId is required");

    const video = await Video.findById(videoId);

   if(video.owner.toString() !== req.user._id.toString()){
    throw new ApiError(400 , "Unauthorized request")
   }

   const changePublishStatus = await Video.findByIdAndUpdate(
    videoId,
    {
        $set : {
            isPublished : !video.isPublished
        },
    },
    {new : true }
   )

   if(!changePublishStatus){
    throw new ApiError(400 , "Error while toggling publish status")
   }

   return res
            .status(200)
            .json(new ApiResponse(200 , changePublishStatus , "Toggled Video Published Status"))
})

export {publishAVideo,getVideoById,updateVideo,deleteVideo,togglePublishStatus}