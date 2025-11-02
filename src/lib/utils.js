// Utility functions for the application

/**
 * Formats active time in minutes to a human-readable string
 * @param {number} minutes - Active time in minutes
 * @returns {string} Formatted time string (e.g., "9m", "7h 6m")
 */
export const formatActiveTime = (minutes) => {
  if (!minutes || minutes === 0) return "0m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
};
