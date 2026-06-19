import { Platform } from 'react-native';
import choirApi from '../../api/choirApi';
import type { User, UserRole } from '../../types/auth';

type PaginatedUsersResponse = {
    users: User[];
    totalPages: number;
};

const toSafeRole = (role: any): UserRole => {
    const r = String(role || 'VIEWER').toUpperCase();

    // Keep only known roles. Default to VIEWER.
    if (r === 'ADMIN' || r === 'EDITOR' || r === 'VIEWER' || r === 'USER' || r === 'SUPER_ADMIN') {
        return r as UserRole;
    }
    return 'VIEWER';
};

const buildMultipartFormData = async (userData: any, imageUri?: string) => {
    const formData = new FormData();

    // Backend expects JSON under "data"
    const userDTO: any = {
        name: userData.name,
        username: userData.username,
        email: userData.email,

        role: toSafeRole(userData.role),

        bio: userData.bio,
        voice: userData.voice,

        // legacy + new instruments system support
        instrument: userData.instrument,
        instrumentId: userData.instrumentId ?? null,
    };

    // Only send password if provided
    if (userData.password) {
        userDTO.password = userData.password;
    }

    formData.append('data', JSON.stringify(userDTO));

    // Attach image if present (and not already a remote URL)
    if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        if (Platform.OS === 'web') {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            // @ts-ignore
            formData.append('file', blob, filename);
        } else {
            // @ts-ignore
            formData.append('file', {
                uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
                name: filename,
                type,
            });
        }
    }

    return formData;
};

const getMultipartConfig = () => {
    const config: any = {
        headers: { 'Content-Type': 'multipart/form-data' },
    };

    // RN-web: let axios set boundary automatically
    if (Platform.OS === 'web') {
        delete config.headers['Content-Type'];
    }

    return config;
};

// LIST (Paginated)
export const getAllUsers = async (page: number = 1, limit: number = 10): Promise<PaginatedUsersResponse> => {
    const { data } = await choirApi.get<any>(`/users?page=${page}&limit=${limit}`);
    return {
        users: data?.users ?? [],
        totalPages: data?.totalPages ?? 1,
    };
};

// DIRECTORY (Used by chat directory screens, etc.)
export const getUserDirectory = async (): Promise<User[]> => {
    const { data } = await choirApi.get<User[]>('/users/directory');
    return data;
};

// SAVE (Create/Update)
// WebApp uses: PUT /users/:id for update, POST /users for create
export const saveUser = async (userData: any, imageUri?: string, userId?: string): Promise<void> => {
    const formData = await buildMultipartFormData(userData, imageUri);
    const config = getMultipartConfig();

    if (userId) {
        await choirApi.put(`/users/${userId}`, formData, config);
    } else {
        await choirApi.post(`/users`, formData, config);
    }
};

// DELETE
export const deleteUser = async (id: string): Promise<void> => {
    await choirApi.delete(`/users/${id}`);
};

// import choirApi from '../../api/choirApi';
// import type { User } from '../../types/auth';
// import { Platform } from 'react-native';

// // Helper: Async FormData Builder
// const createFormData = async (userData: any, imageUri?: string) => {
//     const formData = new FormData();

//     // 1. Map UI fields to English Backend Fields
//     let safeRole = 'VIEWER';
//     if (userData.role) {
//         safeRole = userData.role.toUpperCase(); // Backend uses uppercase Enum
//     }

//     const userDTO = {
//         name: userData.name,
//         username: userData.username,
//         email: userData.email,
//         role: safeRole,
//         instrument: userData.instrument,
//         bio: userData.bio,
//         voice: userData.voice,
//         // Send password only if provided
//         ...(userData.password ? { password: userData.password } : {})
//     };

//     formData.append('data', JSON.stringify(userDTO));

//     // 2. Append Image
//     if (imageUri && !imageUri.startsWith('http')) {
//         const filename = 'profile.jpg';
//         const type = 'image/jpeg';

//         if (Platform.OS === 'web') {
//             try {
//                 const response = await fetch(imageUri);
//                 const blob = await response.blob();
//                 // Backend expects 'file'
//                 formData.append('file', blob, filename);
//             } catch (e) {
//                 console.error("Web image fetch failed", e);
//             }
//         } else {
//             // @ts-ignore
//             formData.append('file', {
//                 uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
//                 name: filename,
//                 type: type,
//             });
//         }
//     }

//     return formData;
// };

// // GET ALL (Paginated)
// export const getAllUsers = async (page = 1, limit = 10): Promise<{ users: User[], totalPages: number }> => {
//     // Backend returns { users: [], totalPages: number, ... }
//     const { data } = await choirApi.get<any>(`/users?page=${page}&limit=${limit}`);
//     return {
//         users: data.users || [],
//         totalPages: data.totalPages || 1
//     };
// };

// // SAVE (Create/Update)
// export const saveUser = async (userData: any, imageUri?: string, userId?: string): Promise<User> => {
//     const formData = await createFormData(userData, imageUri);

//     const requestConfig: any = {
//         headers: { 'Content-Type': 'multipart/form-data' }
//     };

//     if (Platform.OS === 'web') {
//         delete requestConfig.headers['Content-Type'];
//     }

//     if (userId) {
//         // UPDATE
//         const { data } = await choirApi.put<{ user: User }>(`/users/${userId}`, formData, requestConfig);
//         // Backend response structure might be { message, user } or direct user. Adjust if needed.
//         return (data as any).updatedUser || data;
//     } else {
//         // CREATE
//         const { data } = await choirApi.post<{ user: User }>(`/users`, formData, requestConfig);
//         return (data as any).user || data;
//     }
// };

// // DELETE
// export const deleteUser = async (id: string): Promise<void> => {
//     await choirApi.delete(`/users/${id}`);
// };