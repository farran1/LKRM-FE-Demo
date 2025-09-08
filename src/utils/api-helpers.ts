/**
 * Utility functions for safely handling API responses
 */

/**
 * Safely extracts data from an API response
 * @param response - The API response object
 * @param defaultValue - Default value to return if data is not available
 * @returns The extracted data or default value
 */
export function safeExtractData<T>(response: any, defaultValue: T): T {
  if (!response?.data?.data) {
    return defaultValue
  }
  
  // Ensure the data is an array if we expect an array
  if (Array.isArray(defaultValue) && !Array.isArray(response.data.data)) {
    return defaultValue
  }
  
  return response.data.data
}

/**
 * Safely checks if API response data has items
 * @param response - The API response object
 * @returns True if data exists and has items, false otherwise
 */
export function hasData(response: any): boolean {
  return response?.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0
}

/**
 * Safely maps API response data to a new format
 * @param response - The API response object
 * @param mapper - Function to transform each item
 * @param defaultValue - Default value to return if no data
 * @returns Mapped data or default value
 */
export function safeMapData<T, R>(
  response: any, 
  mapper: (item: T) => R, 
  defaultValue: R[]
): R[] {
  if (!hasData(response)) {
    return defaultValue
  }
  
  try {
    return response.data.data.map(mapper)
  } catch (error) {
    console.error('Error mapping API data:', error)
    return defaultValue
  }
}

/**
 * Safely handles API calls with error handling
 * @param apiCall - The API function to call
 * @param defaultValue - Default value to return on error
 * @returns The API response data or default value
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<any>, 
  defaultValue: T
): Promise<T> {
  try {
    const response = await apiCall()
    return safeExtractData(response, defaultValue)
  } catch (error) {
    console.error('API call failed:', error)
    return defaultValue
  }
}
