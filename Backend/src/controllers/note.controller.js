import mongoose from "mongoose";
import { asyncHandler } from "../utils/async-handler";
import { ProjectNote } from "../models/note.models.js"
import { Project } from "../models/project.models.js"
import { ApiError } from "../utils/api-error";
import { ApiResponse } from "../utils/api-response";




//*****************Get Notes***************************/
const getNotes = asyncHandler(async( req,res) => {
    //fetch the project id from the params
    const { projectId } = req.params
    //iss project id ke hisaab se main project ko find karoonga db mein 

    const project = await Project.findById(projectId)

    if(!project) {
        throw new ApiError(404, "Project Not Found")
    }

    const notes = await ProjectNote.find({
        project: new mongoose.Types.ObjectId(projectId),
    }).populate("createdBy", "username fullName avatar")

    return res.status(200).json(new ApiResponse(200,
        notes,"Notes Fetched Successfully"
    ))
})


//*********************Create Notes***********************/

const createNotes = asyncHandler(async(req,res) => {
    //fetch the projectid from params
    //fetch the content which have to be written on the notes

    const { projectId } = req.params
    const { content } = req.body

    //project ko find karoonga
    const project = await Project.findById(projectId)

    if(!project) {
        throw new ApiError(404, "Project Not Found")
    }
    
    //agr project mil gaya h toh 
    //main project mein notes ko create karoonga
    const note = await ProjectNote.create({
        project: new mongoose.Types.ObjectId(projectId),
        content,
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    })

    // Populate the createdBy field before sending the response
    const populatedNote = await ProjectNote.findById(note._id).populate("createdBy", "username fullName avatar")

    return res.status(200).json(new ApiResponse(200, populatedNote, "Note Created Successfully"))
})

//******************Update Notes*******************/
const updateNotes = asyncHandler(async(req,res) => {
    const { noteId } = req.params
    const { content } = req.body

    //pehle main check karoonga  ki notes exists bhi krat h ya nhi
    const existingNote = await ProjectNote.findById(noteId)
    
    if(!existingNote) {
        throw new ApiError(404, "Note Not Found")
    }

    //ab agr notes exists krta h toh main notes ko update karoonga

    const note = await ProjectNote.findByIdAndUpdate(noteId,
        { content },
        {new: true},
    ).populate("createdBy", "username fullName avatar")

    return res.status(200).json(new ApiResponse(200, note, "Note Updated Successfully"))
})


//**********************Delete Notes*********************/

const deleteNotes = asyncHandler(async(req,res) => {

    //note ki id leke aaoo
    const { noteId } = req.params

    //note ko find karoo
    const note = await ProjectNote.findByIdAndDelete(noteId)


    if(!note) {
        throw new ApiError(404, "Note Not Found")
    }

    return res.status(200).json(new ApiResponse(200, note, 
        "Note Deleted Successfully"
    ))
    
})

//***********************get the note by id*************************/

const getNoteByID = asyncHandler(async (req,res) => {
    const { noteId } = req.params

    const note = await ProjectNote.findById(noteId).populate("createdBy", "username fullName avatar")

    if(!note) {
        throw new ApiError(404, "Note Not Found")
    }

    //agr note mil chuka h toh 

    return res.status(200).json(new ApiResponse(200, note, "Note Fetched Successfully"))
})

export { 
    getNotes, 
    createNotes,
    updateNotes,
    deleteNotes,
    getNoteByID
}