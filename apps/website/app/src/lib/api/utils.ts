// src/lib/api/utils.ts
/**
 * Utility function to handle API errors
 * @param error The error object from the API call
 * @param defaultMessage Default message to return if error doesn't have a message
 * @returns A rejected promise with the error message or the default message
 */
export function handleApiError(
  error: any,
  defaultMessage: string = "An error occurred"
) {
  console.error("API Error:", error);

  // If there's an error message from the response, use it
  if (error.response?.data?.message) {
    return Promise.reject(new Error(error.response.data.message));
  }

  // If the error has a message property, use it
  if (error.message) {
    return Promise.reject(new Error(error.message));
  }

  // Otherwise, use the default message
  return Promise.reject(new Error(defaultMessage));
}
