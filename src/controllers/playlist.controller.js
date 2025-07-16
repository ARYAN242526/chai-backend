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

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    const updatedPlaylist = await Playlist.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(playlistId), // Find the playlist by id
            },
        },
        {
            $addFields : {
                videos : {
                    $setUnion : ["$videos" , [new mongoose.Types.ObjectId(videoId)]],
                }
            }
        },
        {
            $merge : {
                into : "playlists",
            }
        }
    ])

    if(!updatedPlaylist){
        throw new ApiError(400 , "Playlist not found or video already added")
    }

    return res
             .status(200)
             .json(new ApiResponse(200 , updatedPlaylist , "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async(req,res) => {
    const {playlistId , videoId} = req.params;

    const videoExists = await Video.exists({_id : videoId})
    
    if(!videoExists){
        throw new ApiError(400 , "Video not found")
    }

    if(!playlistId || !videoId){
        throw new ApiError(400 , "PlaylistId or videoId not found")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId , {
            $pull : {
                videos : videoId
            }
        },
        {new : true}
    )

    if(!updatedPlaylist){
        throw new ApiError(400 , "Playlist not found")
    }

    return res
             .status(200)
             .json(new ApiResponse(200 , updatedPlaylist , "Video removed from playlist"))

})

const deletePlaylist = asyncHandler(async(req,res) => {
    const {playlistId} = req.params;

    if(!playlistId){
        throw new ApiError(400 , "playlistId not found")
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if(!playlist){
        throw new ApiError(400 , "Playlist not found")
    }

    return res
             .status(200)
             .json(new ApiResponse(200 , playlist , "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async(req,res) => {
    const {playlistId} = req.params;
    const {name , description} = req.body;

    if(!playlistId || !name || !description){
        throw new ApiError(400 , "either the playlist id is not defined or name or description")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId , {
            $set : {
                name,
                description, 
                owner : req.user?._id
            }
        },
        {new : true}
    )

    return res
             .status(200)
             .json(new ApiResponse(200 , updatedPlaylist , "Playlist updated successfully"))
})


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}