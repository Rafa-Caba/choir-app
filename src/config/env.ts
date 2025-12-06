
const API_HOST = 'https://ero-cras-webapp-api-production.up.railway.app';

const ENV = {
    API_HOST,
    API_BASE_URL: `${API_HOST}/api`,
    SOCKET_URL: API_HOST,
};

console.log('🔧 Environment Loaded:', ENV);

export default ENV;
