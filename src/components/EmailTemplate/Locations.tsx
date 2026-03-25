import type { MergedStop } from '@/types/stops';
import { t } from '@/utils/i18n';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React from 'react';
import { BASE_URL } from '../../utils/constants';

interface LocationsProps {
  dailyStops: MergedStop[];
  busSelection: {
    [key: string]: number;
  };
}

const Locations: React.FC<LocationsProps> = ({ dailyStops, busSelection }) => {
  return (
    // Outer table: 100% width, centers the inner table
    <table width="650" border={0} cellSpacing={0} cellPadding={0} style={{ margin: '40px 0' }} align="center">
      <tbody>
        <tr>
          <td align="center" width="650">
            {/* Inner table: fixed (or max) width, left-aligned content */}
            <table
              border={0}
              cellSpacing={0}
              cellPadding={0}
              style={{
                borderSpacing: 0,
                borderCollapse: 'collapse',
                textAlign: 'left'
              }}
            >
              <tbody>
                {dailyStops.map((stop, index) => {
                  const isLast = index === dailyStops.length - 1;
                  return (
                    <tr key={stop.time?.toString() || index}>
                      {/* Icon + vertical line cell */}
                      <td
                        style={{
                          width: '24px',
                          verticalAlign: 'top',
                          textAlign: 'center',
                          padding: '0',
                          lineHeight: '0'
                        }}
                      >
                        <img
                          src={`${BASE_URL}/email-assets/locationIcon.png`}
                          alt="Location"
                          style={{ display: 'block', margin: '0 auto' }}
                          width={24}
                          height={24}
                        />
                        {!isLast && (
                          <div
                            style={{
                              width: '1px',
                              backgroundColor: '#9ca3af',
                              margin: '0 auto',
                              height: '100px'
                            }}
                          />
                        )}
                      </td>
                      {/* Stop details cell */}
                      <td
                        style={{
                          paddingLeft: '12px',
                          paddingBottom: '20px',
                          verticalAlign: 'top'
                        }}
                      >
                        <p
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: '#4554a1',
                            margin: '0 0 5px'
                          }}
                        >
                          {stop.address}
                        </p>
                        {stop.time && (
                          <p
                            style={{
                              fontSize: '0.875rem',
                              color: '#374151',
                              margin: '0'
                            }}
                          >
                            {format(stop.time, "dd 'de' MMMM yyyy", { locale: es })}
                          </p>
                        )}
                        {stop.time && (
                          <p
                            style={{
                              fontSize: '0.875rem',
                              color: '#374151',
                              margin: '4px 0'
                            }}
                          >
                            {format(stop.time, 'HH:mm', { locale: es })}
                          </p>
                        )}
                        {stop?.buses
                          ? stop.buses
                              .filter((bus) => bus.numberOfBuses > 0)
                              .map((bus) => (
                                <p
                                  key={bus.busType}
                                  style={{
                                    fontSize: '0.875rem',
                                    color: '#374151',
                                    margin: '4px 0'
                                  }}
                                >
                                  {t(
                                    bus.numberOfBuses === 1 ? 'busSelection.singleBus' : 'busSelection.multipleBuses',
                                    {
                                      count: bus.numberOfBuses,
                                      seats: bus.busType
                                    }
                                  )}
                                </p>
                              ))
                          : Object.entries(busSelection).map(([seats, count]) => (
                              <p
                                key={seats}
                                style={{
                                  fontSize: '0.875rem',
                                  color: '#374151',
                                  margin: '4px 0'
                                }}
                              >
                                {t(count === 1 ? 'busSelection.singleBus' : 'busSelection.multipleBuses', {
                                  count,
                                  seats
                                })}
                              </p>
                            ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* End of inner table */}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default Locations;
