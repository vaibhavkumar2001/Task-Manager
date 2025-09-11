import dotenv from "dotenv"
import app from "./app.js"
import connectDB from "./db/index.js"
import { connect } from "mongoose"



dotenv.config({
    path: "./.env",
})

const PORT = process.env.PORT || 9000

//Connect to Database
connectDB()
.then( () => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
})
.catch( (error) => {
    console.log("Mongo db connect error: ", error)
    process.exit(1)
})
