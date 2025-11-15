import { TaskStatusEnum } from "./constants.js";
/**
 * Get the color for a task status
 * @param {string} status - Task status
 * @returns {string} - Color for the status
 */

export const getStatusColor = (status) => {
    switch (status) {
        case TaskStatusEnum.TODO:
            return "blue"
        case TaskStatusEnum.IN_PROGRESS:
            return "yellow"
        case TaskStatusEnum.DONE:
            return "green" 
        default:
            return "gray"           
    }
}

/**
 * Get the background color for a kanban column
 * @param {string} status - Task status
 * @returns {string} - Background color for the column
 */

export const getColoumnColor = (status) => {
    switch (status) {
        case TaskStatusEnum.TODO:
            return "blue"
        case TaskStatusEnum.IN_PROGRESS:
            return "yellow" 
        case TaskStatusEnum.DONE:
            return "green.0"
        default:
            return "gray.0"           
    }
}

/**
 * Get the label for a task status
 * @param {string} status - Task status
 * @returns {string} - Label for the status
 */

export const getStatusLabel = (status) => {
    switch (status) {
        case TaskStatusEnum.TODO:
            return "To Do"
        case TaskStatusEnum.IN_PROGRESS:
            return "In Progress"    
        case TaskStatusEnum.DONE:
            return "Done"
        default:
            return status   
    }
}

/**
 * Get the status options for a select input
 * @returns {Array} - Array of status options
 */
export const getStatusOptions = () => [
  { value: TaskStatusEnum.TODO, label: "To Do" },
  { value: TaskStatusEnum.IN_PROGRESS, label: "In Progress" },
  { value: TaskStatusEnum.DONE, label: "Done" },
];
