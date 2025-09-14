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
    getCurrentUser,
    refreshAccessToken
} from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/user.middleware.js"
import { validate } from "../middlewares/validator.middleware.js"
import { 
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userLoginValidator,
    userRegisterValidator,
    userResetForgottenPasswordValidator,
 } from "../validators/index.js"
import { verify } from "crypto"

const router = Router()
//isse mere pass router ki saari properties aayhi h

//***************Unsecured route *****************/

//pehle maine register route mtlb path bata diya phir maine userresgister validator laga diya phir validate middleware laga diya phir RegisterUser controller laga diya
router.route("/register").post(userRegisterValidator(), validate, RegisterUser)
router.route("/login").post(userLoginValidator(), validate,
LoginUser)
router.route("/refresh-Token").post(refreshAccessToken)
router.route("/verify-email").get(VerifyEmail)

router.route("/forgot-password").post(userForgotPasswordValidator(), validate,forgotPasswordRequest)

router.route("/reset-password/:resetToken").post(userResetForgottenPasswordValidator(), validate,resetForgottenPassword)

//****************Secured Routes*******************/

router.route("/logout").post(verifyJWT,LogoutUser)

router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/change-password").post(verifyJWT, userChangeCurrentPasswordValidator(), validate,changeCurrentPassword)

router.route("/resend-email-verification").post(verifyJWT,resendEmailVerificationToken)

export default router