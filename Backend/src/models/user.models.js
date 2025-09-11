import mongoose, { Schema } from "mongoose";
import crypto from "crypto"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema({
    avatar: {
        type: String,
        localPath: String,
    },
    default: {
        url: `https://api.dicebear.com/9.x/initials/svg?seed=${username}`,
        localPath: "",
    },
    username: {
        type: String,
        required :true,
        unique: true,
        lowercase:true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    isEmailVerified: {
        type: Boolean,
        default:false,
    },
    refreshToken: {
        type: String,
    },
    forgotPasswordToken: {
        type: String,
    },
    forgotPasswordExpiry: {
        type: Date,
    },
    emailVerificationToken: {
        type: String,
    },
    emailVerificationExpiry: {
        type: Date,
    },
},{timestamps: true})

//main yhi pe password ko hash kr lete hoon 
userSchema.pre("save", async function(next) {
    if(this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10)
    }
    next()
})

//ab main yaha password ko match kraoonga ki password correct h ki nhi
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

//access token generate kar leta hoon 
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username:this.username,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
    )
}

//refresh token ka code likhonga
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
    )
}



// Ye function temporary token generate karne ke liye hai (jaise email verification, password reset, OTP link, etc).

// Isme do cheezein banti hain:

// Unhashed Token (client-facing) → jo user ke email pe bhejna hai.

// Hashed Token (server DB) → jo tumhare database me store hoga security ke liye.
/**
 * @description Method responsible for generating tokens for email verification, password reset etc.
 */
userSchema.methods.generateTemporaryToken = function () {
    // This token should be client facing
    // for example: for email verification unHashedToken should go into the user's mail
    const unHashedToken = crypto.randomBytes(20).toString('hex')
    // This should stay in the DB to compare at the time of verification
    const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex")
    // This is the expiry time for the token (20 minutes)
    const tokenExpiry = Date.now() + (20 * 60 * 1000); 

    return { unHashedToken,hashedToken,tokenExpiry }
}

export const User = mongoose.model("User", userSchema)