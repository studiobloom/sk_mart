import axios from 'axios';

// Using relative URL with proxy
const API_BASE_URL = '';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Helper function to retry failed requests (reusing from marketApi.js)
const retryRequest = async (apiCall, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      console.log(`Attempt ${attempt + 1} failed, retrying in ${(attempt + 1) * 3} seconds...`);
      
      const delay = (attempt + 1) * 3000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Get all items
export const getAllItems = async () => {
  console.log('Fetching all items...');
  
  try {
    const response = await retryRequest(() => 
      apiClient.get('/v1/items')
    );
    console.log('Successfully fetched all items');
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw createEnhancedError(error, 'Failed to fetch items.');
  }
};

// Get item attributes
export const getItemAttributes = async () => {
  console.log('Fetching item attributes...');
  
  try {
    const response = await retryRequest(() => 
      apiClient.get('/v1/items/attributes')
    );
    console.log('Successfully fetched item attributes');
    return response.data;
  } catch (error) {
    console.error('Error fetching item attributes:', error);
    throw createEnhancedError(error, 'Failed to fetch item attributes.');
  }
};

// Get item rarities
export const getItemRarities = async () => {
  console.log('Fetching item rarities...');
  
  try {
    const response = await retryRequest(() => 
      apiClient.get('/v1/items/rarities')
    );
    console.log('Successfully fetched item rarities');
    return response.data;
  } catch (error) {
    console.error('Error fetching item rarities:', error);
    throw createEnhancedError(error, 'Failed to fetch item rarities.');
  }
};

// Get specific item by ID
export const getItemById = async (itemId) => {
  console.log(`Fetching item details for ${itemId}...`);
  
  try {
    const response = await retryRequest(() => 
      apiClient.get(`/v1/items/${itemId}`)
    );
    console.log(`Successfully fetched item details for ${itemId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching item ${itemId}:`, error);
    throw createEnhancedError(error, `Failed to fetch item "${itemId}".`);
  }
};

// Get item icon URL
export const getItemIconUrl = (itemId) => {
  return `${API_BASE_URL}/v1/items/${itemId}/icon`;
};

// Helper function to create enhanced error messages
const createEnhancedError = (error, defaultMessage) => {
  let errorMessage = defaultMessage;
  
  if (error.response) {
    if (error.response.status === 404) {
      errorMessage = 'Item not found. Please check the item ID.';
    } else if (error.response.status === 429) {
      errorMessage = 'Too many requests. Please try again later.';
    } else if (error.response.status >= 500) {
      errorMessage = 'Server error. The API may be experiencing issues.';
    }
  } else if (error.request) {
    errorMessage = 'No response from server. The API may be slow or unavailable.';
  }
  
  const enhancedError = new Error(errorMessage);
  enhancedError.originalError = error;
  return enhancedError;
};

// Create a named object for default export
const itemsApi = {
  getAllItems,
  getItemAttributes,
  getItemRarities,
  getItemById,
  getItemIconUrl
};

export default itemsApi; 