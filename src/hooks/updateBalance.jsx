export const BALANCE_UPDATE_EVENT = 'wallet-balance-updated';

export function triggerBalanceUpdate() {
    window.dispatchEvent(new Event(BALANCE_UPDATE_EVENT));
}