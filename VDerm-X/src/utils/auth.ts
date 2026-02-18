import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_DATA_KEY = '@vdermx_user_data';

export interface UserData {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'vet';
  specialization?: string;
  contact?: string;
  area?: string;
  availability?: string;
  licenseNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Store user data in AsyncStorage after successful login
 */
export const storeUserData = async (userData: UserData): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(userData);
    await AsyncStorage.setItem(USER_DATA_KEY, jsonValue);
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};

/**
 * Retrieve user data from AsyncStorage
 * Returns null if no user data is found
 */
export const getUserData = async (): Promise<UserData | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(USER_DATA_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

/**
 * Clear user data from AsyncStorage (logout)
 */
export const clearUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_DATA_KEY);
  } catch (error) {
    console.error('Error clearing user data:', error);
    throw error;
  }
};

/**
 * Check if user is logged in
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const userData = await getUserData();
    return userData !== null;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};
