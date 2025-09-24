import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Initialize dayjs plugins
dayjs.extend(relativeTime);

/**
 * Format a date string with flexible output based on how recent it is
 * @param {string} dateString - The date string to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeTime - Whether to include time in the output
 * @param {string} options.defaultValue - Value to return if date is invalid
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  const { includeTime = false, defaultValue = "N/A" } = options;

  if (!dateString) return defaultValue;

  try {
    const date = dayjs(dateString);

    // If date is less than 24 hours ago, show relative time
    if (dayjs().diff(date, "day") < 1) {
      return date.fromNow();
    }

    // Otherwise show formatted date
    return date.format(includeTime ? "MMM D, YYYY h:mm A" : "MMM D, YYYY");
  } catch (error) {
    console.error("Error formatting date:", error);
    return defaultValue;
  }
};

/**
 * Format date relative to now (e.g. "2 hours ago", "3 days ago")
 * @param {string} dateString - The date string to format
 * @param {string} defaultValue - Value to return if date is invalid
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateString, defaultValue = "N/A") => {
  if (!dateString) return defaultValue;

  try {
    return dayjs(dateString).fromNow();
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return defaultValue;
  }
};

/**
 * Format date with time
 * @param {string} dateString - The date string to format
 * @param {string} defaultValue - Value to return if date is invalid
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (dateString, defaultValue = "N/A") => {
  if (!dateString) return defaultValue;

  try {
    return dayjs(dateString).format("MMM D, YYYY h:mm A");
  } catch (error) {
    console.error("Error formatting date time:", error);
    return defaultValue;
  }
};
