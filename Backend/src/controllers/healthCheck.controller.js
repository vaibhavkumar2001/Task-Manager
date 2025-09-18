//Yeh controllers yeh check krke bata hai ki apna server alive h ki nhi 
//Bahut usefull h deployment ke liye

import { ApiResponse } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";

const healthCheck = asyncHandler(async(req,res) => {
    res.status(200).json(new ApiResponse(200, {message: "Server is Running"}))
})


export { healthCheck }