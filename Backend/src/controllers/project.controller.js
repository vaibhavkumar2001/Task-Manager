import mongoose from "mongoose";
import { asyncHandler } from "../utils/async-handler";
import { Project } from "../models/project.models";
import { projectMember, ProjectMember } from "../models/projectmember.models.js"
import { AvailableUserRoles,UserRolesEnum } from "../utils/constants.js";
import { ApiError } from "../utils/api-error";
import { ApiResponse } from "../utils/api-response";
import { User } from "../models/user.models.js";
import { pipeline } from "nodemailer/lib/xoauth2/index.js";

const getProjects = asyncHandler(async (req, res) => {
  const projects = await ProjectMember.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "project",
        pipeline: [
          {
            $lookup: {
              from: "projectmembers",
              localField: "_id",
              foreignField: "project",
              as: "projectmembers",
            },
          },
          {
            $addFields: {
              members: {
                $size: "$projectmembers",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$project",
    },
    {
      $project: {
        project: {
          _id: 1,
          name: 1,
          description: 1,
          members: 1,
          createdAt: 1,
          createdBy: 1,
        },
        role: 1,
        _id: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

//*****************get Project by ID*********************/
const getProjectByID = asyncHandler(async(req,res) => {

    //fetch the ID from the params
    const { projectID } = req.params

    //ab main iss id ke correspond project find krke loonga
    const project = await Project.findById(projectID)

    if(!project) {
        throw new ApiError(404,"Project Not Found")
    }

    //agr project mil gaya h toh main aage ka kaam karoonga
    return res.status(200).json(new ApiResponse(200, project,"Project Fetched Successfully"))
})


const createProject = asyncHandler(async(req,res) => {
    const { name,description } = req.body

    const project = await Project.create({
        name,
        description,
        createdBy: mongoose.Types.ObjectId(req.user._id)
    })

    //ab jisne yeh project create kiya mujhe uss member ke account mein add bhi tooh karna hoga ki baad mein pata laga paoon ki kisne project create kiya tha
    await ProjectMember.create({
        project: new mongoose.Types.ObjectId(project._id),
        user:  mongoose.Types.ObjectId(req.user._id),
        role: UserRolesEnum.ADMIN
    })

    return res.status(201).json(new ApiResponse(201, project, "Project created Successfully"))
})



//**********************update Project***************************/
const updateProject = asyncHandler(async(req,res) => {
    //project ki ID fetch karo 
    const { projectID } = req.params
    const { name,description } = req.body

    //project ko find karo
    const project = await Project.findByIdAndUpdate(projectID, { name,description }, {new: true})

    if(!project) {
        throw new ApiError(404, "Project Not Found")
    }

    return res.status(200).json(new ApiResponse(200, Project, "Project Updated Successfully"))
})


//*************************delete Project**************************/


const deleteProject = asyncHandler(async(req,res) => {

    const { projectID } = req.params
    

    const project = await Project.findByIdAndDelete(projectID)

    if(!project) {
        throw new ApiError(404, "Project Not Found")
    }

    return res.status(200).json(new ApiResponse(200, project, "Project Deleted Successfully"))
})

const addMememberToProject = await asyncHandler(async(req,res) => {

    const { email,username,role } = req.body
    const { projectID } = req.params

    const user = await User.findOne({ 
        //$or ka mtlb h ki email aur username mein koi ek bhi available h toh find karo 
        $or:[
            {email},{username}
        ]
    })

    if(!user) {
        throw new ApiError(404, "User Not Found")
    }

    //agr user present h toh 
    await ProjectMember.findByIdAndUpdate(
        {
            user: mongoose.Types.ObjectId(user._id),
            project: mongoose.Types.ObjectId(projectID)
        },
        {

            user:mongoose.Types.ObjectId(user._id),
            project: mongoose.Types.ObjectId(projectID),
            role: role,
        },
        {
            new:true,
            upsert:true
        }
    )

    return res.status(201).json(new ApiResponse(201, user, "Project Member Added Successfully"))
})

const getProjectMembers = asyncHandler(async(req,res) => {
  const { projectID } = req.params

  const project = await Project.findById(projectID)

  if(!project) {
    throw new ApiError(404, "Project Not Found")
  }

  const projectMemebers = await ProjectMember.aggregate([
    {
      $match: {
        project: mongoose.Types.ObjectId(projectID),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              email: 1,
              fullName: 1,
              avatar: 1,
            }
          }
        ]
      }
    },
    {
      $addFields: {
        user:{
          $arrayElemAt: ["$user", 0]
        }
      }
    },
    {
      $project: {
        project: 1,
        user: 1,
        role: 1,
        createdAt: 1,
        updatedAt: 1,
        _id: 0,
      }
    }
  ])

  return res.status(200).json(new ApiResponse(200, projectMemebers, "Project Members Fetched Successfully"))
})

const updateMemberRole = asyncHandler(async(req,res) => {
  const { projectID,userId } = req.params
  const { newRole } = req.body

  if(!AvailableUserRoles.includes(newRole)) {
    throw new ApiError(400, "Invalid Role")
  }
  let projectMember = await ProjectMember.findOne({
    project : mongoose.Types.ObjectId(projectID),
    user: mongoose.Types.ObjectId(userId),
  })

  if(!projectMember) {
    throw new ApiError(404, "Project Member Not Found")
  }

  projectMember = await ProjectMember.findByIdAndUpdate(projectMember._id, { role: newRole }, { new: true })

  if(!projectMember) {
    throw new ApiError(404, "Project Member Not Found ")
  }

  return res.status(200).json(new ApiResponse(200,projectMember, "Project Member Updated Successfully"))
})

const deleteMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;

  let projectMember = await ProjectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!projectMember) {
    throw new ApiError(404, "Project member not found");
  }

  projectMember = await ProjectMember.findByIdAndDelete(projectMember._id);

  if (!projectMember) {
    throw new ApiError(404, "Project member not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        projectMember,
        "Project member deleted successfully",
      ),
    );
});


export {
    getProjects,
    getProjectByID,
    createProject,
    updateProject,
    deleteProject,
    addMememberToProject,
    getProjectMembers,
    updateMemberRole,
    deleteMember
} 