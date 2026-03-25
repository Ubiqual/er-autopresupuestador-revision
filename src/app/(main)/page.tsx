import { default as Booking } from '@/components/Booking/Booking';
import { Chat } from '@/components/NeedHelp/Chat';
import { NeedHelp } from '@/components/NeedHelp/NeedHelp';
import { fetchConfigureTrip } from '../api/admin/fetchConfigureTrip';
import { fetchConfigureWeddings } from '../api/admin/fetchConfigureWeddings';
import { fetchRestHours } from '../api/admin/fetchRestHours';
import { fetchSchemaData } from '../api/admin/fetchSchemaData';
import fetchServices from '../api/fetchServices';
import fetchVat from '../api/fetchVat';

export default async function Home() {
  try {
    const [baseAddress, services, restHours, busTypes, tripMinimums, weddingLimit, vat] = await Promise.all([
      fetchSchemaData('BaseAddress'),
      fetchServices(),
      fetchRestHours(),
      fetchSchemaData('BusType'),
      fetchConfigureTrip(),
      fetchConfigureWeddings(),
      fetchVat()
    ]);

    if (
      !baseAddress ||
      !baseAddress[0]?.address ||
      !services ||
      !restHours ||
      !busTypes ||
      !tripMinimums ||
      !weddingLimit
    ) {
      throw new Error('Failed to fetch all required data. Please try again later.');
    }

    return (
      <>
        <div className="mx-4 lg:mx-0">
          <Booking
            baseAddress={baseAddress[0].address}
            services={services}
            busTypes={busTypes}
            restHours={restHours}
            tripMinimums={tripMinimums}
            weddingLimit={weddingLimit}
            vat={vat.rate}
          />
        </div>
        <NeedHelp />
        <Chat />
      </>
    );
  } catch (error) {
    return (
      <div>
        <h1>Error</h1>
        <p>There was an issue loading the required data. Please refresh the page or try again later.</p>
      </div>
    );
  }
}
