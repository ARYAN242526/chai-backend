import mongoose , {isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";



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

export {publishAVideo,getVideoById}