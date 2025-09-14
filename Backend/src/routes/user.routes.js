import { Router } from "express"

import {
    RegisterUser,
    LoginUser,
    LogoutUser,
    VerifyEmail,
    resendEmailVerificationToken,
    forgotPasswordRequest,
    resetForgottenPassword,
    changeCurrentPassword,
    getCurrentUser
} from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/user.middleware.js"

