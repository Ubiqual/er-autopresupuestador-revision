export function generateQuery({
  serviceName,
  travelStartDateTime,
  travelEndDateTime,
  seasonAdjustment
}: {
  serviceName: string;
  travelStartDateTime: string;
  travelEndDateTime: string;
  seasonAdjustment: number;
}): string {
  return `
        WITH busy_hours AS (
        SELECT 
            bh."adjustmentPercentage" AS "busyTimeAdjustment",
            bh."startTimeMorning",
            bh."endTimeMorning",
            bh."startTimeAfternoon",
            bh."endTimeAfternoon"
        FROM "busy_hours" bh
        ),
        night_hours AS (
            SELECT 
                nh."adjustmentPercentage" AS "nightTimeAdjustment",
                nh."startTime",
                nh."endTime"
            FROM "night_hours" nh
        ),
        base_cost AS (
            SELECT 
                bc."pricePerKm",
                bc."pricePerMinute"
            FROM "base_cost" bc
        ),
        season_adjustment AS (
            SELECT
                bt."numberOfPeople",
                bt."adjustmentPercentage" AS "busTypeAdjustment",
                bc."pricePerKm" * (1 + ${seasonAdjustment}) AS "pricePerKmAfterSeason",
                bc."pricePerMinute" * (1 + ${seasonAdjustment}) AS "pricePerMinuteAfterSeason"
            FROM base_cost bc
            CROSS JOIN "bus_type" bt
        ),
        bus_type_adjustment AS (
            SELECT
                sa."numberOfPeople",
                sa."busTypeAdjustment",
                sa."pricePerKmAfterSeason" * (1 + sa."busTypeAdjustment") AS "pricePerKmAfterBusType",
                sa."pricePerMinuteAfterSeason" * (1 + sa."busTypeAdjustment") AS "pricePerMinuteAfterBusType"
            FROM season_adjustment sa
        ),
        busy_hours_adjustment AS (
            SELECT
                bta."numberOfPeople",
                bh."busyTimeAdjustment",
                bta."busTypeAdjustment",
                CASE
                    WHEN '${serviceName.toLowerCase()}' = 'viajes' THEN bta."pricePerKmAfterBusType"
                    -- Apply busy hour adjustment if there is any overlap with the busy hours
                    WHEN (
                        -- Check busy hours for current day
                        (
                            '${travelStartDateTime}'::timestamp < '${travelStartDateTime}'::date + bh."endTimeMorning"::time 
                            AND '${travelEndDateTime}'::timestamp > '${travelStartDateTime}'::date + bh."startTimeMorning"::time
                        )
                        OR
                        (
                            '${travelStartDateTime}'::timestamp < '${travelStartDateTime}'::date + bh."endTimeAfternoon"::time 
                            AND '${travelEndDateTime}'::timestamp > '${travelStartDateTime}'::date + bh."startTimeAfternoon"::time
                        )
                        -- Check busy hours for next day
                        OR
                        (
                            '${travelStartDateTime}'::timestamp < ('${travelStartDateTime}'::date + INTERVAL '1 day') + bh."endTimeMorning"::time 
                            AND '${travelEndDateTime}'::timestamp > ('${travelStartDateTime}'::date + INTERVAL '1 day') + bh."startTimeMorning"::time
                        )
                        OR
                        (
                            '${travelStartDateTime}'::timestamp < ('${travelStartDateTime}'::date + INTERVAL '1 day') + bh."endTimeAfternoon"::time 
                            AND '${travelEndDateTime}'::timestamp > ('${travelStartDateTime}'::date + INTERVAL '1 day') + bh."startTimeAfternoon"::time
                        )
                    )
                    THEN (bta."pricePerKmAfterBusType" * (1 + COALESCE(bh."busyTimeAdjustment", 0)))
                    ELSE bta."pricePerKmAfterBusType"
                END AS "pricePerKmAfterBusyHours",
                CASE
                    WHEN '${serviceName.toLowerCase()}' = 'viajes' THEN bta."pricePerMinuteAfterBusType"
                    WHEN (
                        -- Check busy hours for current day
                        (
                            '${travelStartDateTime}'::timestamp < '${travelStartDateTime}'::date + bh."endTimeMorning"::time 
                            AND '${travelEndDateTime}'::timestamp > '${travelStartDateTime}'::date + bh."startTimeMorning"::time
                        )
                        OR
                        (
                            '${travelStartDateTime}'::timestamp < '${travelStartDateTime}'::date + bh."endTimeAfternoon"::time 
                            AND '${travelEndDateTime}'::timestamp > '${travelStartDateTime}'::date + bh."startTimeAfternoon"::time
                        )
                        -- Check busy hours for next day
                        OR
                        (
                            '${travelStartDateTime}'::timestamp < ('${travelStartDateTime}'::date + INTERVAL '1 day') + bh."endTimeMorning"::time 
                            AND '${travelEndDateTime}'::timestamp > ('${travelStartDateTime}'::date + INTERVAL '1 day') + bh."startTimeMorning"::time
                        )
                        OR
                        (
                            '${travelStartDateTime}'::timestamp < ('${travelStartDateTime}'::date + INTERVAL '1 day') + bh."endTimeAfternoon"::time 
                            AND '${travelEndDateTime}'::timestamp > ('${travelStartDateTime}'::date + INTERVAL '1 day') + bh."startTimeAfternoon"::time
                        )
                    )
                    THEN (bta."pricePerMinuteAfterBusType" * (1 + COALESCE(bh."busyTimeAdjustment", 0)))
                    ELSE bta."pricePerMinuteAfterBusType"
                END AS "pricePerMinuteAfterBusyHours"
            FROM bus_type_adjustment bta
            LEFT JOIN busy_hours bh ON (
                '${serviceName.toLowerCase()}' != 'viajes' AND (
                    (
                    '${travelStartDateTime}'::timestamp < '${travelStartDateTime}'::date + bh."endTimeMorning"::time 
                    AND '${travelEndDateTime}'::timestamp > '${travelStartDateTime}'::date + bh."startTimeMorning"::time
                )
                OR
                (
                    '${travelStartDateTime}'::timestamp < '${travelStartDateTime}'::date + bh."endTimeAfternoon"::time 
                    AND '${travelEndDateTime}'::timestamp > '${travelStartDateTime}'::date + bh."startTimeAfternoon"::time
                )
                OR
                (
                    '${travelStartDateTime}'::timestamp < ('${travelStartDateTime}'::date + INTERVAL '1 day') + bh."endTimeMorning"::time 
                    AND '${travelEndDateTime}'::timestamp > ('${travelStartDateTime}'::date + INTERVAL '1 day') + bh."startTimeMorning"::time
                )
                OR
                (
                    '${travelStartDateTime}'::timestamp < ('${travelStartDateTime}'::date + INTERVAL '1 day') + bh."endTimeAfternoon"::time 
                    AND '${travelEndDateTime}'::timestamp > ('${travelStartDateTime}'::date + INTERVAL '1 day') + bh."startTimeAfternoon"::time
                )
                ) 
            )
        ),
        final_prices AS (
            SELECT
                bha."numberOfPeople",
                bha."busyTimeAdjustment",
                bha."busTypeAdjustment",
                CASE
                    -- Apply night hour adjustment if there is any overlap with the night hours
                    WHEN '${serviceName.toLowerCase()}' = 'viajes' THEN bha."pricePerKmAfterBusyHours"
                    WHEN (
                        (
                            '${travelStartDateTime}'::timestamp < CASE 
                                WHEN nh."endTime"::time > '00:00'::time AND nh."endTime"::time < '08:00'::time 
                                THEN ('${travelStartDateTime}'::date + INTERVAL '1 day') + nh."endTime"::time
                                ELSE '${travelStartDateTime}'::date + nh."endTime"::time
                            END
                            AND '${travelEndDateTime}'::timestamp > '${travelStartDateTime}'::date + nh."startTime"::time
                        )
                        OR 
                        (
                            '${travelStartDateTime}'::timestamp < '${travelStartDateTime}'::date + nh."endTime"::time
                            
                            AND '${travelEndDateTime}'::timestamp > '${travelStartDateTime}'::date + nh."endTime"::time
                        )
                        OR 
                        (
                            -- inside window when night hours do NOT cross midnight
                            (nh."startTime"::time <= nh."endTime"::time
                                AND '${travelStartDateTime}'::timestamp >= '${travelStartDateTime}'::date + nh."startTime"::time
                                AND '${travelEndDateTime}'::timestamp   <= '${travelStartDateTime}'::date + nh."endTime"::time
                            )
                            OR
                            -- inside window when night hours DO cross midnight (e.g., 21:00 -> 06:30)
                            (nh."startTime"::time > nh."endTime"::time
                                AND '${travelStartDateTime}'::timestamp <  '${travelStartDateTime}'::date + nh."endTime"::time
                                AND '${travelEndDateTime}'::timestamp   <= '${travelStartDateTime}'::date + nh."endTime"::time
                            )
                        )
                    )
                    THEN (bha."pricePerKmAfterBusyHours" * (1 + COALESCE(nh."nightTimeAdjustment", 0)))
                    ELSE bha."pricePerKmAfterBusyHours"
                END AS "finalPricePerKm",
                CASE
                    WHEN '${serviceName.toLowerCase()}' = 'viajes' THEN bha."pricePerMinuteAfterBusyHours"
                    WHEN (
                        (
                            '${travelStartDateTime}'::timestamp < CASE 
                                WHEN nh."endTime"::time > '00:00'::time AND nh."endTime"::time < '08:00'::time 
                                THEN ('${travelStartDateTime}'::date + INTERVAL '1 day') + nh."endTime"::time
                                ELSE '${travelStartDateTime}'::date + nh."endTime"::time
                            END
                            AND '${travelEndDateTime}'::timestamp > '${travelStartDateTime}'::date + nh."startTime"::time
                        )
                        OR 
                        (
                            '${travelStartDateTime}'::timestamp < '${travelStartDateTime}'::date + nh."endTime"::time
                            
                            AND '${travelEndDateTime}'::timestamp > '${travelStartDateTime}'::date + nh."endTime"::time
                        )
                        OR 
                        (
                            (nh."startTime"::time <= nh."endTime"::time
                                AND '${travelStartDateTime}'::timestamp >= '${travelStartDateTime}'::date + nh."startTime"::time
                                AND '${travelEndDateTime}'::timestamp   <= '${travelStartDateTime}'::date + nh."endTime"::time
                            )
                            OR
                            (nh."startTime"::time > nh."endTime"::time
                                AND '${travelStartDateTime}'::timestamp <  '${travelStartDateTime}'::date + nh."endTime"::time
                                AND '${travelEndDateTime}'::timestamp   <= '${travelStartDateTime}'::date + nh."endTime"::time
                            )
                        )
                    )
                    THEN (bha."pricePerMinuteAfterBusyHours" * (1 + COALESCE(nh."nightTimeAdjustment", 0)))
                    ELSE bha."pricePerMinuteAfterBusyHours"
                END AS "finalPricePerMinute",
                nh."nightTimeAdjustment"
            FROM busy_hours_adjustment bha
            LEFT JOIN night_hours nh ON (
                '${serviceName.toLowerCase()}' != 'viajes' AND (
                (
                    '${travelStartDateTime}'::timestamp < CASE 
                        WHEN nh."endTime"::time > '00:00'::time AND nh."endTime"::time < '08:00'::time 
                        THEN ('${travelStartDateTime}'::date + INTERVAL '1 day') + nh."endTime"::time
                        ELSE '${travelStartDateTime}'::date + nh."endTime"::time
                    END
                    AND '${travelEndDateTime}'::timestamp > '${travelStartDateTime}'::date + nh."startTime"::time
                )
                OR
                (
                    '${travelStartDateTime}'::timestamp < '${travelStartDateTime}'::date + nh."endTime"::time
                    
                    AND '${travelEndDateTime}'::timestamp > '${travelStartDateTime}'::date + nh."endTime"::time
                )
                OR
                (
                    (nh."startTime"::time <= nh."endTime"::time
                        AND '${travelStartDateTime}'::timestamp >= '${travelStartDateTime}'::date + nh."startTime"::time
                        AND '${travelEndDateTime}'::timestamp   <= '${travelStartDateTime}'::date + nh."endTime"::time
                    )
                    OR
                    (nh."startTime"::time > nh."endTime"::time
                        AND '${travelStartDateTime}'::timestamp <  '${travelStartDateTime}'::date + nh."endTime"::time
                        AND '${travelEndDateTime}'::timestamp   <= '${travelStartDateTime}'::date + nh."endTime"::time
                    )
                )
                ) 
            )
        )
        SELECT 
            fp."numberOfPeople",
            fp."finalPricePerKm",
            fp."finalPricePerMinute",
            ${seasonAdjustment} AS "seasonAdjustment",
            fp."busTypeAdjustment",
            fp."busyTimeAdjustment",
            fp."nightTimeAdjustment"
        FROM final_prices fp;
      `;
}
