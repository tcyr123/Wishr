export const API = "http://192.168.0.13:3001" //better than "localhost" or "127.0.0.1" for testing external devices like your phone
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