import { Router } from "express";
import {
    addMememberToProject,
    createProject,
    deleteMember,
    deleteProject,
    getProjectByID,
    getProjectMembers,
    getProjects,
    updateMemberRole,
    updateProject,
} from "../controllers/project.controller.js"
import { validateProjectPermission,verifyJWT } from "../middlewares/user.middleware.js"
import { validate } from "../middlewares/validator.middleware.js"
import { AvailableUserRoles,UserRolesEnum } from "../utils/constants.js";

import { addMemberToProjectValidator,createProjectValidator } from "../validators/index.js"

const router = Router()

router.use(verifyJWT)

router.route("/")
.get(getProjects)
.post(createProjectValidator(), validate, createProject)

router.route("/:projectId")
.get(validateProjectPermission(AvailableUserRoles), getProjectByID)
.put(validateProjectPermission([UserRolesEnum.ADMIN]),

createProjectValidator(),
validate,
updateProject,
)
.delete(validateProjectPermission([UserRolesEnum.ADMIN]),
deleteProject)

router.route("/:projectId/members")
.get(getProjectMembers)
.post(validateProjectPermission([UserRolesEnum.ADMIN]),
addMemberToProjectValidator(),
validate,
addMememberToProject)

router.route("/:projectId/members/:userId")
.put(validateProjectPermission([UserRolesEnum.ADMIN]),
updateMemberRole)
.delete(validateProjectPermission([UserRolesEnum.ADMIN]),
deleteMember)

export default router