import { notifications } from "@mantine/notifications";
import axios from "axios";
import { StorageKeys } from "../utils/constants.js"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 100000,
})

//Request Interceptor for adding auth Token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(StorageKeys.ACCESS_TOKEN)
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

//Helper Function to show error notifications
const showErrorNotification = (error) => {
    //extract error messages from the response
    const errorMessages = 
    error.response?.data?.message || 
    error.message || 
    "An Unexpected Error Occured"

    //show notification
    notifications.show({
        title: "Error",
        message: errorMessages,
        color: "red",
        autoClose: 5000,
    })
}