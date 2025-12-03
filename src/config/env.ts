import Constants from 'expo-constants';

const ENV = {
    LOCAL_IP: Constants.expoConfig?.extra?.localIp || 'localhost',
    PORT: Constants.expoConfig?.extra?.port || '10000',
    PROD_URL: Constants.expoConfig?.extra?.prodUrl || '',
};

console.log("🔧 Environment Loaded:", ENV);

export default ENV;