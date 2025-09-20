import { Router } from "express"
import { healthCheck } from "../controllers/healthCheck.controller.js"

//router instanciate karoonga
const router = Router()

router.route("/").get(healthCheck)