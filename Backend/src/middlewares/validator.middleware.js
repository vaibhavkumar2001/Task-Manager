import { validationResult } from "express-validator"
import { ApiError } from "../utils/api-error.js"
import { errorHandler } from "./error.middleware.js"

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 *
 * @description This is the validate middleware responsible to centralize the error checking done by the `express-validator` `ValidationChains`.
 * This checks if the request validation has errors.
 * If yes then it structures them and throws an {@link ApiError} which forwards the error to the {@link errorHandler} middleware which throws a uniform response at a single place
 *
 */

//Yeh check krta h ki jo user req kar rha h usme koi error toh nhi 
export const validate = (req,res,next) => {
    const errors = validationResult(req)
    //yeh ye check kr rha h ki user ne jo req bheji h usme koi error toh nhi
    if(errors.isEmpty()) {
        return next();
    }
    //aur agr error h toh throw krdoonga
    const extractedErrors = []
    errors.array().map((err) => extractedErrors.push({[err.path] : err.msg}))

    throw new ApiError(422, "Received data is not valid", extractedErrors)
}