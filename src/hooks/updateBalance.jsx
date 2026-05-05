import { useEffect } from 'react';

const BALANCE_UPDATE_EVENT = 'wallet-balance-updated';

export function UseTriggerBalanceUpdate() {
    return () => {
        window.dispatchEvent(new Event(BALANCE_UPDATE_EVENT));
    };
}

/**
 * @param {Function} onUpdateCallback 
 */
export function useListenBalanceUpdate(onUpdateCallback) {
    useEffect(() => {
        if (!onUpdateCallback) return;

        window.addEventListener(BALANCE_UPDATE_EVENT, onUpdateCallback);

        return () => {
            window.removeEventListener(BALANCE_UPDATE_EVENT, onUpdateCallback);
        };
    }, [onUpdateCallback]);
}