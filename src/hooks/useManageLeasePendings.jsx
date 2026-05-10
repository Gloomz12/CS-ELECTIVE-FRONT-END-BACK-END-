import { useMemo } from 'react';

export default function useManageLeasePendings(tenants) {
    return useMemo(() => {
        if (!tenants || tenants.length === 0) return [];

        const currentDate = new Date();

        return tenants.map((tenant) => {
            const { 
                startDate, 
                monthlyRate, 
                totalPaid, 
                leaseTerm, 
                totalDue 
            } = tenant;

            if (!startDate || !monthlyRate) return tenant;

            const start = new Date(startDate);

            let requiredMonths = (currentDate.getFullYear() - start.getFullYear()) * 12 + 
                                 (currentDate.getMonth() - start.getMonth());

            const lastDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            const effectiveStartDay = Math.min(start.getDate(), lastDayOfCurrentMonth);

            if (currentDate.getDate() >= effectiveStartDay) {
                requiredMonths += 1;
            }

            requiredMonths = Math.min(Math.max(0, requiredMonths), leaseTerm);

            const requiredPayment = Math.min((requiredMonths * monthlyRate), totalDue);
            const rawPendingPayment = requiredPayment - totalPaid;

            let status = "Up to date";
            let displayPendingPayment = 0;

            if (rawPendingPayment > 0) {
                status = "Pending";
                displayPendingPayment = rawPendingPayment;
            } else if (rawPendingPayment < 0) {
                status = "Advanced payment";
                displayPendingPayment = 0; 
            }
            return {
                ...tenant,
                calculatedStatus: status,
                calculatedMonthsPending: rawPendingPayment / monthlyRate,
                calculatedPendingPayment: displayPendingPayment
            };
        });
    }, [tenants]);
}