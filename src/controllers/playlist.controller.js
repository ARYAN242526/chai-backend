import mongoose , {isValidObjectId} from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async(req,res) => {

    const {name , description} = req.body;

    if([name , description].some((field) => field?.trim() === "")){
        throw new ApiError(400 , "All fields are required")
    }

    const playlist = await Playlist.create({
        name : name,
        description : description ,
        owner : req.user?._id
    })

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    return res
            .status(201)
            .json(new ApiResponse(201 , playlist , "Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params;

    if(!userId){
        throw new ApiError(400 , "userId not found in icoming request")
    }

    const playlists = await Playlist.find({owner : userId})

    if(!playlists){
        throw new ApiError(404 , "User playlists not found")
    }

    return res
            .status(200)
            .json(new ApiResponse(200 , playlists , "User playlists fetched successfully"))

})

const getPlaylistById  = asyncHandler(async(req,res) => {
    const {playlistId} = req.params;

    if(!playlistId){
        throw new ApiError(400 , "Playlist Id not found")
    }

    const playlist = await Playlist.findById(playlistId).populate("videos");

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    return res
              .status(200)
              .json(new ApiResponse(200 , playlist ,"Playlist fetched successfully"))
})



export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
}