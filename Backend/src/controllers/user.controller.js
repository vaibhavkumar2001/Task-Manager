import { User } from "../models/user.models.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { asyncHandler } from "../utils/async-handler.js"
import crypto from "crypto"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // attach refresh token to the user document to avoid refreshing the access token with multiple refresh tokens
        user.refreshToken = refreshToken

        user.save({ ValidateBeforeSave: false })
        return { accessToken,refreshToken }
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating Access token and refresh token"
        )
    }
}

//******************************Register User***************************************/
const RegisterUser = asyncHandler(async (req,res) => {
    //user ki details fetch krni h 
    //check if user already exists
    // if not exists create the user
    //token generate krna h 
    //aur token user ko bhi send krna h 
    const { email,username,password,role } = req.body
    
    const exsistedUser = await User.findOne({
        $or: [{email}, {username}],
    })

    if(exsistedUser) {
        throw new ApiError(409,"User with Email or username already exists",[]);
    }

    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified:false,
    })

    /**
   * unHashedToken: unHashed token is something we will send to the user's mail
   * hashedToken: we will keep record of hashedToken to validate the unHashedToken in verify email controller
   * tokenExpiry: Expiry to be checked before validating the incoming token
   */

    const { unHashedToken,HashedToken,tokenExpiry } = user.generateTemporaryToken();

    /**
   * assign hashedToken and tokenExpiry in DB till user clicks on email verification link
   * The email verification is handled by {@link verifyEmail}
   */

    user.emailVerificationToken = HashedToken
    user.emailVerificationExpiry = tokenExpiry
    await user.save({validateBeforeSave: false})

    await sendEmail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      //yeh token maine banaya h 
      `${req.protocol}://${req.get(
        "host",
      )}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(
    new ApiResponse(
        200,
        {user: createdUser },
        "Users registered successfully and verification email has been sent on your email."
    )
  )
})

//****************************login User************************************/ 
const LoginUser = asyncHandler(async(req,res) => {
    //fetch the data
    //validate it 
    //password ko compare kro 
    //token ka bhi kuch krna hoga
    const { email,password,username } = req.body

    if(!username && !email) {
        throw new ApiError(400,"Email or username is required")
    }

    //ab user ko DB mein find karoonga
    const user = await User.findOne({
        $or: [{username}, {email}],
    })

    if(!user) {
        throw new APiError(404,"User not found")
    }

    //compare the incoming password with the one in DB
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401,"Password is incorrect")
    }

    //sb valid hogaya toh ab main access token aur refresh token generate karoonga
    const { accessToken,refreshToken } = await generateAccessAndRefreshToken(user._id) 
    //hamesha refresh token aur access token user._id se generate hota h 

    // get the user document ignoring the password and refreshToken field
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  //Yeh code snippet mainly cookies set karne ke liye options define karta hai
  const options = {
    httpOnly:true,
    secure: process.env.NODE_ENV === "production",
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  //yeh maine access token ko set krdiya h cookie mein 
  //aur refresh token mein bhi 
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
        200,
        {user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
    )
  )
})

//************************Logout User************************************/
const LogoutUser = asyncHandler(async(req,res) => {
    //mera yahan pe kaam ye hoga ki main access token aur refresh token ko delete kardoonga
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: null
            }
        },
        {new: true}
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out Successfully"))
})

//*********************verify Email*********************/

const VerifyEmail = asyncHandler(async(req,res) => {
    const { verificationToken } = req.params

    if(!verificationToken) {
        throw new ApiError(400,"Verification token is required")
    }
    // generate a hash from the token that we are receiving
    let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex")

    // While registering the user, same time when we are sending the verification mail
  // we have saved a hashed value of the original email verification token in the db
  // We will try to find user with the hashed token generated by received token
  // If we find the user another check is if token expiry of that token is greater than current time if not that means it is expired

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  })

  if(!user) {
    throw new ApiError(489,"Token is invalid or Expired")
  }

  // If we found the user that means the token is valid
  // Now we can remove the associated email token and expiry date as we no  longer need them
  user.emailVerificationToken = undefined
  user.emailVerificationExpiry = undefined

  // Turn the email verified flag to `true`
  user.isEmailVerified = true
  await user.save({validateBeforeSave: false})

  return res
    .status(200)
    .json(new ApiResponse(200, { isEmailVerified: true }, "Email is verified"));
})

// This controller is called when user is logged in and he has snackbar that your email is not verified
// In case he did not get the email or the email verification token is expired
// he will be able to resend the token while he is logged in

//**************Resend Verification Token EMail***********************/
const resendEmailVerificationToken = asyncHandler(async(req,res) => {
    const user = await User.findById(req.user?._id)

    if(!user) {
        throw new ApiError(404,"User not found")
    }

    //check if user email is already verified so throw error
    if(user.isEmailVerified) {
        throw new ApiError(400,"Email is already verified")
    }

    const { unhashedToken,hashedToken,tokenExpiry } = user.generateTemporaryToken()

    //Hashed token DB mein store karte h 
    //unhashed token ko user ko return kr dete h 
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry
    await user.save({validateBeforeSave: false})

    await sendEmail({
        email: user?.email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationMailgenContent(
          user.username,
          //yeh token maine banaya h 
          `${req.protocol}://${req.get(
            "host",
          )}/api/v1/users/verify-email/${unhashedToken}`,
        ),
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {emailVerificationToken: unhashedToken},
            "Email verification token sent successfully"
        )
    )
})

//************************Refresh Access TOken************************/

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // check if incoming refresh token is same as the refresh token attached in the user document
    // This shows that the refresh token is used or not
    // Once it is used, we are replacing it with new refresh token below
    if (incomingRefreshToken !== user?.refreshToken) {
      // If token is valid but is used already
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    // Update the user's refresh token in the database
    user.refreshToken = newRefreshToken;
    await user.save();

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const forgotPasswordRequest = asyncHandler(async(req,res) => {
  //mail lelo 
  //find the user form the user email in the db and matches for token verification
  //ek temporary token generate karoonga
  //mail send karoonga
  const { email } = req.body

  const user = await User.findOne({email})

  if(!user) {
    throw new ApiError(404,"User does not exists")
  }

  //agr user exists karta h toh main hashed aur unhashed token generate karloonga
  const { unhashedToken,hashedToken,tokenExpiry } = generateTemporaryToken() 
  //saare token generate hogaya h 
  //phir main hashed token aur token expiry token ko db mein store karloonga
  user.forgotPasswordToken = hashedToken
  user.forgotPasswordExpiry = tokenExpiry
  await user.save({validateBeforeSave: false})

  // Send mail with the password reset link. It should be the link of the frontend url with token
  await sendEmail({
    email:user?.email,
    subject: "Password Reset Request",
    mailgenContent: forgotPasswordMailgenContent(
      user.username,
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unhashedToken}`,
    )
  }) 

  return res
  .status(200)
  .json(
    new ApiResponse(200,
      {},
      "Password Reset mail has been senf on your mail Id"
    )
  )
})

const resetForgottenPassword = asyncHandler(async(req,res) => {
  const { resetToken } = req.params
  const { newPassword } = req.body

  // Create a hash of the incoming reset token

  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

    // See if user with hash similar to resetToken exists
    // If yes then check if token expiry is greater than current date
    const user = User.findOne({
      forgotPasswordToken:hashedToken,
      forgotPasswordExpiry: { $gt: Date.now()},
    })
    // If either of the one is false that means the token is invalid or expired
    if(!user) {
      throw new ApiError(489,"Token is invalid or expired")
    }

    //if everything is OK and token id valid h 
    //reset the forgot password token and expirey

    user.forgotPasswordToken = undefined
    user.forgotPasswordExpiry = undefined

    //set the provided password as the new password
    user.password = newPassword
    await user.save({validateBeforeSave: false})
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Reset Successfully"))
})

const changeCurrentPassword = asyncHandler(async(req,res) => {
  //fetch the data -> old password and new password
  //validate it 
  //token match karoonga
  const { oldPassword,newPassword } = req.body

  const user = await User.findById(req.user?._id)

  if(!user) {
    throw new ApiError(404,"User not found")
  }

  //compare the incoming password adnd one which is present in the Db

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect) {
    throw new ApiError(401,"Invalid Old Password")
  }

  // assign new password in plain text
  // We have a pre save method attached to user schema which automatically hashes the password whenever added/modified

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password Changed Successfully"))
})

//*****************get current user***********************/
const getCurrentUser = asyncHandler(async(req,res) => {
  return res
  .status(200)
  .json(
    new ApiResponse(200,req.user, "User details fetched successfully")
  )
})


export {
    RegisterUser,
    LoginUser,
    LogoutUser,
    VerifyEmail,
    resendEmailVerificationToken,
    forgotPasswordRequest,
    resetForgottenPassword,
    changeCurrentPassword,
    getCurrentUser
    }