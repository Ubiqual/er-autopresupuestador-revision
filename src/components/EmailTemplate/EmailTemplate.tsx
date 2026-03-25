import type { DailyStopsState } from '@/contexts/DailyStopsContext';
import { EmailType } from '@/types/Emails';
import type { MergedStop } from '@/types/stops';
import type { StopData } from '@/types/TravelCalculations';
import type { ReturnTrip } from '@/types/WeedingReturnTrips';
import React from 'react';
import DeclinedMessageBox from './DeclinedMessageBox';
import Footer from './Footer';
import Header from './Header';
import Locations from './Locations';
import Price from './Price';

interface EmailTemplateProps {
  totalPrice: number;
  dailyStops: DailyStopsState;
  busSelection: { [key: string]: number };
  emailType: EmailType;
  returnTrips?: ReturnTrip[];
  vatAmount?: string;
  serviceType: string;
}

export function TableEmailTemplate({
  totalPrice,
  dailyStops,
  busSelection,
  returnTrips,
  emailType,
  vatAmount,
  serviceType
}: EmailTemplateProps) {
  const allStops: MergedStop[] = Array.from(dailyStops.values()).flatMap((dayStops) => [
    dayStops.pickup,
    ...dayStops.intermediates,
    dayStops.dropoff
  ]);

  let stopsToRender: MergedStop[] = allStops;
  let extraReturnStops: MergedStop[] = [];
  if (returnTrips?.length) {
    extraReturnStops = returnTrips.flatMap((rt: ReturnTrip) => {
      const main: MergedStop = {
        address: rt.address,
        time: rt.time,
        buses: rt.buses,
        day: 0
      };
      const inner: MergedStop[] = rt.stops.map((s: StopData) => ({
        ...s,
        time: s.time,
        buses: rt.buses,
        day: 0
      }));
      return [main, ...inner];
    });
  }

  /* remove duplicates (address + timestamp) that clash with forward stops */
  const forwardWithoutDupes = allStops.filter((f) => {
    const fTime = f.time;
    return !extraReturnStops.some((e) => e.address === f.address && e.time === fTime);
  });

  /* build final list: everything except last forward stop → returns → last stop */
  stopsToRender = forwardWithoutDupes;
  if (extraReturnStops.length) {
    stopsToRender = [...forwardWithoutDupes, ...extraReturnStops];
  }

  return (
    <html>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#ffffff',
          fontFamily: 'Verdana, sans-serif'
        }}
      >
        <table
          width="100%"
          border={0}
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: '#ffffff' }}
          align="center"
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  width="650"
                  border={0}
                  cellPadding={0}
                  cellSpacing={0}
                  style={{ margin: '0 auto', padding: '20px', maxWidth: '650px' }}
                >
                  <tbody>
                    <tr>
                      <td>
                        <Header type={emailType} />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Locations dailyStops={stopsToRender} busSelection={busSelection} />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        {emailType === EmailType.DECLINED ? (
                          <DeclinedMessageBox />
                        ) : (
                          <Price
                            totalPrice={totalPrice}
                            type={emailType}
                            vatAmount={vatAmount}
                            serviceType={serviceType}
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Footer />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export default TableEmailTemplate;
