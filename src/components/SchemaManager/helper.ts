import type { SeasonDay } from '@prisma/client';
import { addDays, isSameDay } from 'date-fns';
import type { Season } from './SeasonDayManager';

export const handleRangeSelection = ({
  utcDate,
  rangeStart,
  rangeEnd,
  setRangeStart,
  setRangeEnd,
  middleDates,
  setMiddleDates,
  updateDates,
  localData,
  selectedSeason,
  busyDates
}: {
  utcDate: Date;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  localData: SeasonDay[];
  selectedSeason: Season | null;
  setRangeStart: (date: Date | null) => void;
  setRangeEnd: (date: Date | null) => void;
  middleDates: Date[];
  setMiddleDates: (dates: Date[]) => void;
  updateDates: (datesToAdd: Date[], datesToRemove: Date[]) => void;
  busyDates: Date[];
}) => {
  if (!rangeStart) {
    // Start a new range
    setRangeStart(utcDate);
    setRangeEnd(null);
    setMiddleDates([]);

    updateDates([utcDate], []); // Add the start date
  } else if (!rangeEnd) {
    if (isSameDay(utcDate, rangeStart)) {
      // If clicking on the start date, clear the range
      setRangeStart(null);
      setRangeEnd(null);
      setMiddleDates([]);

      updateDates([], [utcDate]); // Remove the start date
    } else {
      // Complete the range
      const startDate = utcDate < rangeStart ? utcDate : rangeStart;
      const endDate = utcDate < rangeStart ? rangeStart : utcDate;
      setRangeStart(startDate);
      setRangeEnd(endDate);

      const datesInRange = [];
      let currentDate = addDays(startDate, 1);

      // Collect all dates within the range
      while (currentDate < endDate) {
        datesInRange.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
      }

      setMiddleDates(datesInRange);

      const datesToAdd: Date[] = [];
      const datesToRemove: Date[] = [];

      datesInRange.forEach((date) => {
        const busyDate = busyDates.find((busyDate) => isSameDay(busyDate, date));
        if (busyDate) {
          const busyDayInLocalData = localData.find((item) => isSameDay(new Date(item.day), busyDate));
          if (
            (busyDayInLocalData && busyDayInLocalData.seasonId !== selectedSeason?.id) ||
            isSameDay(busyDate, startDate)
          ) {
            datesToAdd.push(date);
          } else {
            datesToRemove.push(date);
          }
        } else {
          datesToAdd.push(date);
        }
      });
      const handleBoundaryDate = (date: Date) => {
        const dateInLocalData = localData.find((item) => isSameDay(new Date(item.day), date));
        if (dateInLocalData) {
          if (dateInLocalData.seasonId !== selectedSeason?.id) {
            datesToAdd.push(date);
          } else {
            datesToRemove.push(date);
          }
        } else {
          datesToAdd.push(date);
        }
      };

      handleBoundaryDate(startDate);
      handleBoundaryDate(endDate);

      updateDates(datesToAdd, datesToRemove);
    }
  } else {
    if (utcDate < rangeStart) {
      // User clicked before the start date, so set this as the new start date
      const previousRangeDates = [rangeStart, rangeEnd, ...middleDates];
      setRangeStart(utcDate);
      setRangeEnd(null);
      setMiddleDates([]);

      updateDates([utcDate], previousRangeDates);
    } else if (isSameDay(utcDate, rangeStart)) {
      // If clicking on the start date, clear the range
      setRangeStart(null);
      setRangeEnd(null);
      setMiddleDates([]);
      updateDates([], [rangeStart, rangeEnd, ...middleDates]); // Remove the entire range
    } else if (isSameDay(utcDate, rangeEnd)) {
      // If clicking on the end date, move the end date to the new position
      setRangeStart(utcDate);
      setRangeEnd(null);
      setMiddleDates([]);

      updateDates([utcDate], []); // Update with the new end date
    } else if (utcDate > rangeStart && utcDate < rangeEnd) {
      // If clicking inside the range, move the end date to the new position
      const previousEndDate = rangeEnd;

      setRangeEnd(utcDate);
      const startDate = rangeStart!;
      const endDate = utcDate;

      const datesInRange: Date[] = [];
      let currentDate = addDays(startDate, 1);

      while (currentDate < endDate) {
        datesInRange.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
      }

      setMiddleDates(datesInRange);

      const filteredDatesInRange = middleDates.filter(
        (date) => !isSameDay(date, endDate) && !datesInRange.some((d) => isSameDay(d, date))
      );

      updateDates([], [...filteredDatesInRange, previousEndDate]);
    } else {
      // Move the end date to the new position
      setRangeEnd(utcDate);
      const previousEndDate = rangeEnd;
      const startDate = rangeStart!;
      const endDate = utcDate;

      const datesInRange = [];
      let currentDate = addDays(startDate, 1);

      while (currentDate < endDate) {
        datesInRange.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
      }
      const filteredDatesInRange = datesInRange.filter(
        (date) =>
          !isSameDay(date, startDate) &&
          !isSameDay(date, previousEndDate) &&
          !middleDates.some((d) => isSameDay(d, date))
      );
      setMiddleDates(datesInRange);
      updateDates([endDate, ...filteredDatesInRange], []);
    }
  }
};

export const updateDatesHelper = ({
  datesToAdd,
  datesToRemove,
  busyDates,
  setBusyDates,
  addedDates,
  setAddedDates,
  removedDates,
  setRemovedDates
}: {
  datesToAdd: Date[];
  datesToRemove?: Date[];
  busyDates: Date[];
  setBusyDates: (dates: Date[]) => void;
  addedDates: Date[];
  setAddedDates: (dates: Date[]) => void;
  removedDates: Date[];
  setRemovedDates: (dates: Date[]) => void;
}) => {
  const newBusyDates = [...busyDates];
  const newAddedDates = [...addedDates];
  const newRemovedDates = [...removedDates];

  if (datesToRemove) {
    datesToRemove.forEach((date) => {
      const dateIndex = newBusyDates.findIndex((d) => isSameDay(d, date));
      if (dateIndex !== -1) {
        newBusyDates.splice(dateIndex, 1);
        newRemovedDates.push(date);
      }
      const addedIndex = newAddedDates.findIndex((d) => isSameDay(d, date));
      if (addedIndex !== -1) {
        newAddedDates.splice(addedIndex, 1);
      }
    });
  }

  datesToAdd.forEach((date) => {
    const isDateAlreadyBusy = busyDates.some((d) => isSameDay(d, date));
    if (!isDateAlreadyBusy) {
      newBusyDates.push(date);
      newAddedDates.push(date);
    }

    const removedIndex = newRemovedDates.findIndex((d) => isSameDay(d, date));
    if (removedIndex !== -1) {
      newRemovedDates.splice(removedIndex, 1);
    }
  });

  setBusyDates(newBusyDates);
  setAddedDates(newAddedDates);
  setRemovedDates(newRemovedDates);
};

// Function to convert time from HH:mm to decimal
export const convertTimeToDecimal = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    return 0;
  }
  return hours + minutes / 60;
};

// Function to convert decimal hours to HH:mm
export const convertDecimalToTime = (decimal: number) => {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};
