import AddButton from '@/assets/icons/add-button.svg';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectTrigger
} from '@/components/ui';
import { useDailyStops } from '@/contexts/DailyStopsContext';
import type { StopData } from '@/types/TravelCalculations';
import { t } from '@/utils/i18n';
import { Cross1Icon } from '@radix-ui/react-icons';
import { addHours, format } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useEffect } from 'react';

interface ReturnTripsModalProps {
  lastStopAddress: string;
  initialTrip?: StopData;
  availableReturnBusTypes: { [numberOfPeople: string]: number };
  weddingMinMaxTimeForFirstPickup: { minTime: string; maxTime: string };
  handleIntermediateStopTimeChange: (index: number, value: string) => void;
  lastStopIndex: number;
  maxTime?: string;
  getWeddingMinTime: (
    index: number,
    returnTrips: {
      time: string;
    }[],
    lastStopIndex: number
  ) => string;
  drivingTimes: {
    [key: string]: number;
  };
  intermediateStops: StopData[];
  dropoffLocation: StopData;
}

const ReturnTripsModal = ({
  lastStopAddress,
  initialTrip,
  availableReturnBusTypes,
  weddingMinMaxTimeForFirstPickup,
  handleIntermediateStopTimeChange,
  getWeddingMinTime,
  maxTime,
  drivingTimes,
  lastStopIndex,
  intermediateStops,
  dropoffLocation
}: ReturnTripsModalProps) => {
  const { setReturnTrips, returnTrips } = useDailyStops();
  // Remove useEffect for isOpen, always initialize if empty
  useEffect(() => {
    const stopsAfterCelebration = intermediateStops.slice((lastStopIndex ?? -1) + 1);

    if (!returnTrips || returnTrips.length === 0) {
      setReturnTrips([
        {
          address: initialTrip!.address ?? '',
          time: initialTrip!.time ?? '',
          stops: stopsAfterCelebration,
          buses: [{ busType: Object.keys(availableReturnBusTypes)[0], numberOfBuses: 0 }]
        }
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastStopAddress, initialTrip, intermediateStops]);

  const handleAddReturnTrip = () => {
    const stopsAfterCelebration = intermediateStops.slice((lastStopIndex ?? -1) + 1);
    setReturnTrips([
      ...returnTrips,
      {
        address: lastStopAddress,
        time: '',
        stops: stopsAfterCelebration,
        buses: [{ busType: Object.keys(availableReturnBusTypes)[0], numberOfBuses: 1 }]
      }
    ]);
  };

  const handleReturnTripTimeChange = (index: number, value: string) => {
    setReturnTrips((prevTrips) =>
      prevTrips.map((trip, i) => {
        if (i !== index) {
          return trip;
        } // untouched trips

        /* ---- rebuild stops for the edited trip ---- */
        const newStops: StopData[] = [];

        trip.stops.forEach((stop, sIdx) => {
          let baseDate: Date;

          if (sIdx === 0) {
            const driving = drivingTimes[`${trip.address}_${stop.address}`] ?? 0;
            baseDate = addHours(new Date(value), driving);
          } else {
            const prevStop = newStops[sIdx - 1]; // <— use newStops here
            const driving = drivingTimes[`${prevStop.address}_${stop.address}`] ?? 0;
            baseDate = addHours(new Date(prevStop.time!), driving);
          }

          newStops.push({
            ...stop,
            time: format(baseDate, 'yyyy-MM-dd HH:mm')
          });
        });

        if (newStops.length !== 0) {
          const dropoff = dropoffLocation;
          const dropoffDriving = drivingTimes[`${newStops[newStops.length - 1]?.address}_${dropoff.address}`] ?? 0;
          const dropoffTime = addHours(new Date(newStops[newStops.length - 1].time as string), dropoffDriving);
          newStops.push({
            ...dropoff,
            time: format(dropoffTime, 'yyyy-MM-dd HH:mm')
          });
        } else {
          const driving = drivingTimes[`${trip.address}_${dropoffLocation.address}`] ?? 0;
          const baseDate = addHours(new Date(value), driving);
          newStops.push({
            ...dropoffLocation,
            time: format(baseDate, 'yyyy-MM-dd HH:mm')
          });
        }

        return {
          ...trip,
          time: value, // new departure time
          stops: newStops // freshly calculated stops
        };
      })
    );
  };

  const handleRemoveReturnTrip = (index: number) => {
    const updatedTrips = returnTrips.filter((_, i) => i !== index);
    setReturnTrips(updatedTrips);
  };

  const handleBusSelectionChange = (index: number, busType: string, count: number) => {
    const updatedTrips = [...returnTrips];
    const buses = [...updatedTrips[index].buses];

    const busIndex = buses.findIndex((bus) => bus.busType === busType);

    if (busIndex !== -1) {
      if (count === 0) {
        buses.splice(busIndex, 1);
      } else {
        buses[busIndex].numberOfBuses = count;
      }
    } else if (count > 0) {
      buses.push({ busType, numberOfBuses: count });
    }

    updatedTrips[index] = {
      ...updatedTrips[index],
      buses
    };

    setReturnTrips(updatedTrips);
  };

  const isSaveDisabled = returnTrips.some((trip) => !trip.time || !trip.buses.some((bus) => bus.numberOfBuses > 0));

  // Remove Dialog, DialogContent, DialogTitle, and save/cancel buttons
  return (
    <div className="w-full max-h-[500px] overflow-y-auto pr-2 bg-white mb-4">
      <div className="text-left mb-4">{t('bookingPage.returnTripsModal.title')}</div>
      <div className="mt-4">
        {returnTrips.map((trip, index) => (
          <div key={index} className="relative flex flex-col lg:flex-row w-full gap-4 mb-3 lg:items-center">
            <div className="flex w-[90%] lg:w-full">
              <label className="block text-sm font-medium text-gray-700 sm:min-w-[90px] mr-9">
                {t('bookingPage.returnTripsModal.trip')} {index + 1}
              </label>
              <Input
                type="time"
                value={trip.time || ''}
                onChange={(e) => {
                  handleReturnTripTimeChange(index, e.target.value);
                  if (index === 0) {
                    handleIntermediateStopTimeChange(lastStopIndex, e.target.value);
                  }
                }}
                isTimeInput={true}
                placeholderName={t('timeInputPlaceholder')}
                loading={!weddingMinMaxTimeForFirstPickup.minTime}
                minTime={
                  index === 0 || Object.keys(drivingTimes).length === 0
                    ? weddingMinMaxTimeForFirstPickup.minTime
                    : getWeddingMinTime(index, returnTrips, lastStopIndex)
                }
                maxTime={maxTime}
              />
            </div>
            <div className="flex w-full lg:w-auto">
              <div className="flex flex-col w-[90%] lg:w-full">
                <Select>
                  <SelectTrigger
                    className={`w-auto lg:w-[300px] selectedBusText ${
                      trip.buses.reduce((total, bus) => total + bus.numberOfBuses, 0) !== 0
                        ? 'text-[#313131]'
                        : 'text-[#bfbfbf] italic'
                    } border-[#000000] rounded-full h-[2.6875rem] text-md`}
                  >
                    <span className="block font-medium">
                      {(() => {
                        const totalBuses = trip.buses.reduce((total, bus) => total + bus.numberOfBuses, 0);
                        if (totalBuses === 1) {
                          return `${totalBuses} ${t('bookingPage.placeholders.selectedSingleBus')}`;
                        }
                        if (totalBuses > 1) {
                          return `${totalBuses} ${t('bookingPage.placeholders.selectedBuses')}`;
                        }
                        return t('bookingPage.returnTripsModal.selectBus');
                      })()}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="w-full flex flex-col">
                    {Object.entries(availableReturnBusTypes).map(([busType, maxCount]) => (
                      <div key={busType} className="py-2 flex items-center justify-between px-2">
                        <div className="text-sm font-medium">
                          {busType === '55' ? 'Autocar de 31 a 55 plazas' : 'Minibus hasta 30 plazas'}&nbsp;
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div className="w-auto cursor-pointer border border-gray-300 rounded px-3 py-2 flex items-center justify-between rounded-full ">
                              <span className="block text-sm font-medium">
                                {trip.buses.find((bus) => bus.busType === busType)?.numberOfBuses || '0'}{' '}
                                {t('bookingPage.labels.buses')}
                              </span>
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {Array.from({ length: maxCount + 1 }, (_, count) => (
                              <DropdownMenuItem
                                key={`${busType}-${count}`}
                                onSelect={() => handleBusSelectionChange(index, busType, count)}
                              >
                                {`${count}  ${count !== 1 ? t('bookingPage.labels.buses') : t('bookingPage.labels.bus')}`}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="border-none absolute right-0 top-1/2 -translate-y-1/2 lg:static lg:top-auto lg:translate-y-0"
              onClick={() => handleRemoveReturnTrip(index)}
            >
              <Cross1Icon className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <div
          className={`flex items-center gap-2 group mt-4 ${
            returnTrips.length >= 10 || isSaveDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
          onClick={returnTrips.length >= 10 || isSaveDisabled ? undefined : handleAddReturnTrip}
        >
          <div className="sm:min-w-[8.6rem]"></div>
          <AddButton width={50} height={50} />
          <label
            className={`block text-sm font-medium ${
              returnTrips.length >= 10 ? 'text-gray-300' : 'text-gray-400'
            } ${returnTrips.length >= 10 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {t('bookingPage.returnTripsModal.addTrip')}
          </label>
        </div>
      </div>
    </div>
  );
};

export default ReturnTripsModal;
