const axios = require('axios');

exports.handler = async function (event, context) {
  // Extract the path without the leading /api prefix
  let path = event.path.replace('/.netlify/functions/api', '');
  
  // If the path still starts with /api, remove it
  if (path.startsWith('/api')) {
    path = path.substring(4); // Remove the '/api' prefix
  }
  
  // Debug logging
  console.log('Original path:', event.path);
  console.log('Processed path:', path);
  
  const queryString = event.queryStringParameters 
    ? Object.keys(event.queryStringParameters)
        .map(key => `${key}=${encodeURIComponent(event.queryStringParameters[key])}`)
        .join('&')
    : '';
  
  const url = `https://api.darkerdb.com${path}${queryString ? '?' + queryString : ''}`;
  
  console.log('Proxying request to:', url);
  
  try {
    // Forward the request to the actual API
    const response = await axios({
      method: event.httpMethod,
      url: url,
      headers: {
        'Content-Type': 'application/json',
        // You can add any required API keys or auth headers here
      },
      data: event.body ? JSON.parse(event.body) : undefined,
    });
    
    console.log('API response status:', response.status);
    
    return {
      statusCode: response.status,
      body: JSON.stringify(response.data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Or specify your domain
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    };
  } catch (error) {
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('API response status:', error.response.status);
      console.error('API response data:', error.response.data);
    }
    
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: error.response?.data || 'Internal Server Error',
        message: error.message,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Or specify your domain
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    };
  }
}; 