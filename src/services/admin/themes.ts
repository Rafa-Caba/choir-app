// import choirApi from '../../api/choirApi';
// import type { ThemeDefinition } from '../../types/theme';

// // Helper: Convert Flat Mobile Object -> Backend Array Structure
// const mapThemeToBackend = (data: ThemeDefinition) => {
//     return {
//         nombre: data.name,
//         colores: [
//             { nombre: 'Principal', colorClass: 'primary', color: data.primaryColor },
//             { nombre: 'Acento', colorClass: 'accent', color: data.accentColor },
//             { nombre: 'Fondo', colorClass: 'background', color: data.backgroundColor },
//             { nombre: 'Texto Principal', colorClass: 'text', color: data.textColor },
//             { nombre: 'Tarjeta', colorClass: 'card', color: data.cardColor },
//             { nombre: 'Botón', colorClass: 'button', color: data.buttonColor },
//             { nombre: 'Navegación', colorClass: 'nav', color: data.navColor },

//             // Optional fields
//             ...(data.buttonTextColor ? [{ nombre: 'Texto Botón', colorClass: 'buttontext', color: data.buttonTextColor }] : []),
//             ...(data.secondaryTextColor ? [{ nombre: 'Texto Secundario', colorClass: 'secondarytext', color: data.secondaryTextColor }] : []),
//             ...(data.borderColor ? [{ nombre: 'Bordes', colorClass: 'border', color: data.borderColor }] : [])
//         ]
//     };
// };

// // PUT /api/themes-group/{id}
// export const updateThemeDefinition = async (id: string, data: ThemeDefinition): Promise<ThemeDefinition> => {
//     const backendPayload = mapThemeToBackend(data);
//     const { data: response } = await choirApi.put<any>(`/theme-groups/${id}`, backendPayload);
//     return response;
// };

// // POST /api/themes-group (Create new)
// export const createThemeDefinition = async (data: ThemeDefinition): Promise<ThemeDefinition> => {
//     const backendPayload = mapThemeToBackend(data);
//     const { data: response } = await choirApi.post<any>('/theme-groups', backendPayload);
//     return response;
// };

// // DELETE /api/themes-group/{id}
// export const deleteThemeDefinition = async (id: string): Promise<void> => {
//     // await choirApi.delete(`/theme-groups/${id}`);
// };