// import axios from 'axios';

export const API = "http://localhost:3001"
export const userEmail = "easton@gmail.com"


// export const axiosInstance = axios.create({
//     withCredentials: true,
//     baseURL: 'http://host.docker.internal:3001',
// });

// export default axiosInstance;

//temp until DB is implemented
export function findLists(user_email = userEmail, lists = []) {
    const foundLists = lists.filter(list => list.creator === user_email);
    return foundLists
}

export function findSharedLists(user_email = userEmail, sharedLists = [], lists = []) {
    const shared = sharedLists.filter(list => list.shared_user === user_email).map(sharedList => sharedList.list_id);
    const fullSharedList = lists.filter(list => shared.includes(list.id));
    return fullSharedList
}

export function formatDate(originalDate) {
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