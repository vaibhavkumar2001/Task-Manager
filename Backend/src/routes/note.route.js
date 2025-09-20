import { Router } from "express"
import { 
    createNotes,
    deleteNotes,
    getNoteByID,
    getNotes,
    updateNotes
} from "../controllers/note.controller.js"
import { validateProjectPermission,verifyJWT } from "../middlewares/user.middleware.js"
import { validate } from "../middlewares/validator.middleware.js"
import { AvailableUserRoles,UserRolesEnum } from "../utils/constants.js"
import { notesValidator } from "../validators/index.js"

const router = Router()

router.use(verifyJWT)

router.route("/:projectId")
.get(validateProjectPermission(AvailableUserRoles),getNotes)
.post(validateProjectPermission([UserRolesEnum.ADMIN]),
notesValidator(),
validate,
createNotes)

router
  .route("/:projectId/n/:noteId")
  .get(validateProjectPermission(AvailableUserRoles), getNoteByID)
  .put(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    notesValidator(),
    validate,
    updateNotes,
  )
  .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteNotes);

export default router;