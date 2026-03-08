import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { apierror } from "../utils/Apierror.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if (!name) {
        throw new apierror(404 , "Playlist name is required")
    }

    const playlist = await Playlist.create({
        name,
        description: description || "",
        owner:req.user?._id
    })

    return res.status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "playlist created successfully"
    ))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new apierror(400 , "Invalid userId")
    }

    const playlists = await Playlist.findOne({owner: new mongoose.Types.ObjectId(userId)})

    return res.status(200)
    .json(new ApiResponse(
        200,
        playlists,
        "user playlist fetched successfully"
    ))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new apierror(400 , "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId).populate("videos")

    if (!playlist) {
        throw new apierror(404 , "playlist not found")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "playlist fetched successfully"
    ))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new apierror(400 , "Invalid playlist or videoId")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new apierror(404 , "playlist not found")
    }

    if(playlist.videos.includes(videoId)){
        throw new apierror(404 , "video already exists")
    }

    playlist.videos.push(videoId)
    await playlist.save()

    return res.status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "video added to playlist successfully"
    ))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new apierror(400 , "Invalid PlaylistId or VideoId")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {$pull:{videos: videoId}},
        {new:true}
    )

    if (!playlist) {
        throw new apierror(404 , "Playlist not found")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "video removed from playlist successfully"
    ))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!playlistId) {
        throw new apierror(400 , "Invalid playlistId")
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId)

    if (!playlist) {
        throw new apierror(404 , "playlist not found")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        {},
        "playlist deleted successfully"
    ))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!playlistId) {
        throw new apierror(400 , "Invalid Playlist")
    }

    if (!name && !description) {
        throw new apierror(400 , "write name and description")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {$set:{name , description}},
        {new: true , runValidators:true}
    )

    if (!playlist) {
        throw new apierror(404 , "playlist not found")
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "playlist updated successfully"
    ))
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