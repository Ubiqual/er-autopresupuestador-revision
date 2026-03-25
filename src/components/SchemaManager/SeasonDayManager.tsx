'use client';

import { fetchSeasons } from '@/app/api/admin/seasons/fetchSeasons';
import { updateSeasonDays } from '@/app/api/admin/seasons/updateSeasonDays';
import { Button, Calendar, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/index';
import { Switch } from '@/components/ui/switch';
import type { SeasonDay } from '@prisma/client';
import { isSameDay } from 'date-fns';
import { useEffect, useState } from 'react';
import { Tooltip } from 'react-tooltip';

import { ToastType, useToastModal } from '@/contexts/ToastModalContext';
import { LoadingContainer, LoadingContent } from '../ui/loading';
import { handleRangeSelection, updateDatesHelper } from './helper';

export interface Season {
  id: string;
  name: string;
  adjustmentPercentage: number;
  color: string;
}

interface SeasonDayManagerProps {
  data: SeasonDay[];
}

const SeasonDayManager = ({ data }: SeasonDayManagerProps) => {
  const { showToast } = useToastModal();

  const [localData, setLocalData] = useState<SeasonDay[]>(data);
  const [busyDates, setBusyDates] = useState<Date[]>(localData.map((item) => new Date(item.day)));
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [addedDates, setAddedDates] = useState<Date[]>([]);
  const [removedDates, setRemovedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [middleDates, setMiddleDates] = useState<Date[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await fetchSeasons();
      if (result.success && result.data) {
        setSeasons(result.data);
        setSelectedSeason(result.data[0]);
        setBusyDates(localData.map((item) => new Date(item.day)));
      } else {
        showToast({ message: `Ha ocurrido un error: ${result.error}`, toastType: ToastType.error });
      }
      setLoading(false);

      setInitialLoadComplete(true);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filteredData = selectedSeason ? localData.filter((item) => item.seasonId === selectedSeason.id) : localData;
    setBusyDates(filteredData.map((item) => new Date(item.day)));
    setAddedDates([]);
    setRemovedDates([]);
    if (initialLoadComplete) {
      setLoading(false);
    }
  }, [localData, selectedSeason]);

  const handleDayClick = (date: Date) => {
    if (!selectedSeason || !isEditMode) {
      return;
    }

    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    if (isRangeMode) {
      handleRangeSelection({
        utcDate,
        rangeStart,
        rangeEnd,
        setRangeStart,
        setRangeEnd,
        middleDates,
        localData,
        selectedSeason,
        setMiddleDates,
        updateDates: (datesToAdd, datesToRemove) =>
          updateDatesHelper({
            datesToAdd,
            datesToRemove,
            busyDates,
            setBusyDates,
            addedDates,
            setAddedDates,
            removedDates,
            setRemovedDates
          }),
        busyDates: localData.map((item) => new Date(item.day)) // Passing busyDates here
      });
    } else {
      const isAlreadyBusy = busyDates.some((busyDate) => isSameDay(busyDate, utcDate));

      if (isAlreadyBusy) {
        updateDatesHelper({
          datesToAdd: [],
          datesToRemove: [utcDate],
          busyDates,
          setBusyDates,
          addedDates,
          setAddedDates,
          removedDates,
          setRemovedDates
        });
      } else {
        updateDatesHelper({
          datesToAdd: [utcDate],
          datesToRemove: [],
          busyDates,
          setBusyDates,
          addedDates,
          setAddedDates,
          removedDates,
          setRemovedDates
        });
      }
    }
    setHasUnsavedChanges(true);
  };

  const isBusyDate = (date: Date) => busyDates.some((busyDate) => isSameDay(busyDate, date));

  const getDayColor = (date: Date) => {
    const busyDateColor = isBusyDate(date) ? getBusyDateColor(date) : undefined;

    if (isRangeMode && rangeStart) {
      if (isSameDay(date, rangeStart) || isSameDay(date, rangeEnd as Date)) {
        return selectedSeason?.color || 'gray';
      }
      if (middleDates.some((d) => isSameDay(d, date))) {
        return 'rgba(128, 128, 128, 0.2)';
      }
    }

    return busyDateColor || 'transparent';
  };

  const handleSeasonChange = (seasonId: string) => {
    if (hasUnsavedChanges) {
      const confirmChange = window.confirm(
        'You have unsaved changes. Are you sure you want to switch seasons? Unsaved changes will be lost.'
      );
      if (!confirmChange) {
        return;
      }
    }
    setLoading(true);
    const season = seasons.find((season) => season.id === seasonId);
    setSelectedSeason(season || null);
  };

  const handleSave = async () => {
    if (!selectedSeason) {
      return;
    }

    setSaving(true);

    const result = await updateSeasonDays(selectedSeason.id, addedDates, removedDates);

    setSaving(false);

    if (result.success && result.data) {
      // Update the local data and busy dates
      setLocalData(result.data);
      setBusyDates(result.data.map((item) => new Date(item.day)));

      // Clear the range selection and added/removed dates
      setAddedDates([]);
      setRemovedDates([]);
      setRangeStart(null);
      setRangeEnd(null);
      setMiddleDates([]);

      showToast({ message: 'Tarifas actualizadas correctamente!', toastType: ToastType.success });
    } else {
      showToast({ message: `Ha ocurrido un error: ${result.error}`, toastType: ToastType.error });
    }
  };

  useEffect(() => {
    if (isEditMode) {
      setSelectedSeason(seasons[0] || null); // Preselect the first season when entering edit mode
    } else {
      setSelectedSeason(null); // Reset selected season when in view mode
    }
  }, [isEditMode, seasons]);

  const getBusyDateColor = (date: Date) => {
    if (!selectedSeason) {
      // Look for the corresponding busy date in localData
      const busyDate = localData.find((item) => isSameDay(new Date(item.day), date));
      if (busyDate) {
        const season = seasons.find((season) => season.id === busyDate.seasonId);
        return season?.color || 'transparent';
      }
      return 'transparent';
    }

    // If selectedSeason is set, return its color
    return selectedSeason.color || 'transparent';
  };

  const getSeasonNameForDate = (date: Date) => {
    const busyDate = localData.find((item) => isSameDay(new Date(item.day), date));
    if (busyDate) {
      const season = seasons.find((season) => season.id === busyDate.seasonId);
      return season ? season.name : null;
    }
    return null;
  };

  return (
    <div className="min-w-[90vw] p-8 bg-white flex flex-col items-center justify-center">
      {loading ? (
        <LoadingContainer>
          <LoadingContent></LoadingContent>
        </LoadingContainer>
      ) : (
        <>
          <div className="w-full flex justify-center mb-4">
            <div className="flex items-center space-x-2">
              <span>Modo vista</span>
              <Switch
                checked={isEditMode}
                onCheckedChange={(checked) => {
                  setLoading(true);
                  setIsEditMode(checked);
                }}
              />
              <span>Modo edición</span>
            </div>
          </div>
          <div className="flex w-full">
            {isEditMode && (
              <div className="flex w-[400px] justify-center mb-4">
                <div className="flex items-center space-x-2">
                  <span>Selección individual</span>
                  <Switch checked={isRangeMode} onCheckedChange={setIsRangeMode} />
                  <span>Selección por rangos</span>
                </div>
              </div>
            )}
            {isEditMode && (
              <div className="w-full flex justify-center mb-4">
                <Select onValueChange={handleSeasonChange} value={selectedSeason?.id || undefined}>
                  <SelectTrigger className="w-full p-2 border border-gray-300 rounded-lg">
                    <SelectValue placeholder="Select Season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((season) => (
                      <SelectItem key={season.id} value={season.id}>
                        {season.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="w-full flex justify-center">
            <Calendar
              className="text-lg"
              classNames={{
                months: 'grid grid-cols-1',
                month: 'space-y-8',
                caption: 'flex justify-between items-center text-2xl font-semibold mb-4',
                caption_label: 'text-2xl font-semibold',
                nav: 'flex items-center justify-between w-full px-4',
                nav_button: 'h-10 w-10 bg-gray-200 rounded-full p-3',
                head_row: 'w-[90vw] grid grid-cols-7',
                head_cell: 'text-white bg-black font-medium text-xl h-20 flex items-center justify-center',
                row: 'grid grid-cols-7 gap-0 w-[90vw]',
                cell: 'h-20 flex items-center justify-center text-lg font-semibold border border-gray-300'
              }}
              components={{
                Day: ({ date }) => {
                  const seasonName = getSeasonNameForDate(date);
                  return (
                    <div
                      data-tooltip-id={`tooltip-${date.toISOString()}`}
                      data-tip={seasonName || ''}
                      style={{ backgroundColor: getDayColor(date) }}
                      className={`w-full h-full flex items-center justify-center rounded-lg cursor-pointer ${
                        isBusyDate(date) ? 'text-white' : 'hover:bg-gray-200'
                      }`}
                      onClick={() => handleDayClick(date)}
                    >
                      {date.getDate()}
                      {seasonName && (
                        <Tooltip
                          id={`tooltip-${date.toISOString()}`}
                          place="bottom"
                          content={`Es parte de la temporada ${seasonName}`}
                        />
                      )}
                    </div>
                  );
                }
              }}
            />
          </div>
          {addedDates.length > 5 && (
            <div className="w-full flex justify-center mt-4">
              <span className="text-red-500 font-semibold">Guardando, podría tardar hasta 5 minutos...</span>
            </div>
          )}
          <div className="w-full flex justify-center mt-4">
            <Button onClick={handleSave} disabled={!selectedSeason || saving} className="p-2">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default SeasonDayManager;
