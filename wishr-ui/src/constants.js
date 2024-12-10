export const API = import.meta.env?.VITE_API_URL || "unknown_api"
export const userEmail = "easton@gmail.com"
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



// export const axiosInstance = axios.create({
//     withCredentials: true,
//     baseURL: 'http://localhost:3001',
// });

// export default axiosInstance;

//puts date in format: Mar 23, 2023, 08:22 AM
export function formatDateWords(originalDate) {
    if (!originalDate) {
        return '';
    }

    const date = new Date(originalDate);
    const options = {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    };

    return date.toLocaleString('en-US', options);
}

//puts date in format: 03/05/2023 08:22AM
export function formatDateNumbers(originalDate) {
    if (!originalDate) {
        return '';
    }

    const date = new Date(originalDate);

    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours() % 12 || 12; // Convert to 12-hour format
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'pm' : 'am';

    return `${month}/${day}/${year} ${hours}:${minutes}${ampm}`;
}

export function isStringEmpty(param) {
    return !param || param.trim() === ""
}

export function containsEmptyString(paramArr) {
    return paramArr.some(param => isStringEmpty(param));
}
