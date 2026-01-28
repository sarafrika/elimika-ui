import { useMemo } from "react";

type ScheduleItem = {
    duration_minutes?: number | string;
};

type ScheduleStats = {
    sessions: number;
    totalMinutes: number;
    totalHours: string;
    mostCommonDuration: string;
};

export function useScheduleStats(
    schedule: ScheduleItem[] = []
): ScheduleStats {
    return useMemo(() => {
        if (!schedule.length) {
            return {
                sessions: 0,
                totalMinutes: 0,
                totalHours: "0h",
                mostCommonDuration: "N/A",
            };
        }

        // 1. Sessions
        const sessions = schedule.length;

        // 2. Total duration
        const totalMinutes = schedule.reduce((sum, s) => {
            const minutes = Number(s?.duration_minutes);
            return sum + (Number.isFinite(minutes) ? minutes : 0);
        }, 0);

        const totalHours = `${(totalMinutes / 60).toFixed(1)}`;

        // 3. Most common duration
        const durationMap: Record<number, number> = {};

        schedule.forEach((s) => {
            const minutes = Number(s?.duration_minutes);
            if (Number.isFinite(minutes)) {
                durationMap[minutes] = (durationMap[minutes] || 0) + 1;
            }
        });

        const mostCommonMinutes = Number(
            Object.entries(durationMap).sort((a, b) => b[1] - a[1])[0]?.[0]
        );

        const mostCommonDuration = mostCommonMinutes
            ? `${mostCommonMinutes / 60} hr(s)`
            : "N/A";

        return {
            sessions,
            totalMinutes,
            totalHours,
            mostCommonDuration,
        };
    }, [schedule]);
}
