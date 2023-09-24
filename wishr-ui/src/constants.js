export const API = "http://192.168.0.13:3001"
export const userEmail = "easton@gmail.com"

//temp until DB is implemented
export function findUser(user_email = userEmail, users = []) {
    const foundUsers = users.filter(user => user.email === user_email);
    return foundUsers[0]
}

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