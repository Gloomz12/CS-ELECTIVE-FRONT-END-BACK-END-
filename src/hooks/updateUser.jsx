const USER_UPDATE_EVENT = 'user-profile-updated';

export function triggerUserUpdate() {
    window.dispatchEvent(new Event(USER_UPDATE_EVENT));
}

export { USER_UPDATE_EVENT };