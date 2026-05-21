import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useFetchTransactions = (userId) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTransactions = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get("http://localhost/api/transactions/fetchTransaction.php", {
                params: {
                    userId: userId 
                }
            });

            if (response.data.success) {
                setTransactions(response.data.data || []);
            } else {
                setError(response.data.message || "Failed to load transactions.");
            }
        } catch (err) {
            console.error("Fetch Transactions Error:", err);
            setError("Server connection error.");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    return { transactions, loading, error, refetch: fetchTransactions };
};

export default useFetchTransactions;