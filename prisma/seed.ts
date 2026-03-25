import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBaseData() {
  // Seed Base Address
  await prisma.baseAddress.upsert({
    where: { address: 'Sol, Centro, Madrid' },
    update: {},
    create: { address: 'Sol, Centro, Madrid' }
  });

  // Seed Bus Types
  const busTypes = [
    {
      numberOfPeople: 55,
      rangeMinSeats: 36,
      rangeMaxSeats: 59,
      adjustmentPercentage: 0.0,
      isDefault: true
    },
    {
      numberOfPeople: 30,
      rangeMinSeats: 23,
      rangeMaxSeats: 35,
      adjustmentPercentage: -0.1,
      isDefault: false
    }
  ];

  for (const busType of busTypes) {
    await prisma.busType.upsert({
      where: { numberOfPeople: busType.numberOfPeople },
      update: {
        rangeMinSeats: busType.rangeMinSeats,
        rangeMaxSeats: busType.rangeMaxSeats,
        adjustmentPercentage: busType.adjustmentPercentage,
        isDefault: busType.isDefault
      },
      create: {
        numberOfPeople: busType.numberOfPeople,
        rangeMinSeats: busType.rangeMinSeats,
        rangeMaxSeats: busType.rangeMaxSeats,
        adjustmentPercentage: busType.adjustmentPercentage,
        isDefault: busType.isDefault
      }
    });
  }

  // Seed Services
  const services = [
    { name: 'Traslados', order: 10 },
    { name: 'Transfer aeropuerto', order: 20 },
    { name: 'Transfer tren', order: 30 },
    { name: 'Excursiones', order: 40 },
    { name: 'Viajes', order: 50 },
    { name: 'Bodas', order: 60 }
  ];

  for (const service of services) {
    const seededService = await prisma.service.upsert({
      where: { name: service.name },
      update: { name: service.name, order: service.order },
      create: { name: service.name, order: service.order }
    });

    // Seed ServiceMinimumPricing
    if (service.name === 'Excursiones' || service.name === 'Viajes' || service.name === 'Bodas') {
      // Specific values for Traslados
      await prisma.serviceMinimumPricing.create({
        data: {
          serviceName: seededService.name,
          minimumKM: 12,
          minimumTime: 30
        }
      });
    } else {
      // Default values for other services
      await prisma.serviceMinimumPricing.create({
        data: {
          serviceName: seededService.name,
          minimumKM: 25,
          minimumTime: 75
        }
      });
    }
  }

  // Seed Bus Categories
  const busCategories = [
    { name: 'Estándar', adjustmentPercentage: 0.0 },
    { name: 'Estándar Plus', adjustmentPercentage: 0.15 },
    { name: 'Gran Lujo', adjustmentPercentage: 0.3 }
  ];

  for (const category of busCategories) {
    await prisma.busCategory.upsert({
      where: { name: category.name },
      update: { adjustmentPercentage: category.adjustmentPercentage },
      create: { name: category.name, adjustmentPercentage: category.adjustmentPercentage }
    });
  }

  // Seed Admin Users
  const adminEmails = [
    'smilkovdavor@gmail.com',
    'fernando@pragmalayer.com',
    'er@estebanrivas.es',
    'ccalcerrada@estebanrivas.es',
    'jmmartinez@estebanrivas.es'
  ];

  for (const email of adminEmails) {
    await prisma.user.upsert({
      where: { email },
      update: {
        role: UserRole.ADMIN
      },
      create: {
        email,
        role: UserRole.ADMIN
      }
    });
  }

  // Seed VAT
  await prisma.vAT.create({
    data: {
      rate: 0.1
    }
  });

  // Seed RestHours
  await prisma.restHours.create({
    data: {
      drivingTime: 4.5,
      restDuration: 0.75,
      fullDayDriving: 9,
      fullDayRest: 10,
      excursionsLimit: 14
    }
  });

  // Seed GoogleIncrement
  await prisma.googleIncrement.create({
    data: {
      adjustmentPercentage: 0.25
    }
  });

  // Seed Base Cost
  await prisma.baseCost.create({
    data: {
      pricePerKm: 0.89,
      pricePerMinute: 0.631
    }
  });

  await prisma.busyHours.create({
    data: {
      startTimeMorning: '06:30',
      endTimeMorning: '09:00',
      startTimeAfternoon: '15:00',
      endTimeAfternoon: '17:00',
      adjustmentPercentage: 0.1
    }
  });

  // Seeding NightHours
  await prisma.nightHours.create({
    data: {
      startTime: '22:00',
      endTime: '06:30',
      adjustmentPercentage: 0.2
    }
  });

  const extras = [
    {
      name: 'Nocturnidad Boda',
      price: 26.59
    },
    {
      name: 'Cena en Comunidad de Madrid',
      price: 15.21,
      startTime: '20:00',
      endTime: '22:00'
    },
    {
      name: 'Comida en Comunidad de Madrid',
      price: 15.21,
      startTime: '12:00',
      endTime: '16:00'
    },
    {
      name: 'Dieta Complementaria Viaje',
      price: 23.79
    },
    {
      name: 'Alojamiento y desayuno España',
      price: 72.47
    },
    {
      name: 'Comida en España, Portugal y Andorra',
      price: 21.74,
      startTime: '12:00',
      endTime: '16:00'
    },
    {
      name: 'Cena en España, Portugal y Andorra',
      price: 21.74,
      startTime: '20:00',
      endTime: '22:00'
    },
    {
      name: 'Comida Internacional',
      price: 36.32,
      startTime: '12:00',
      endTime: '16:00'
    },
    {
      name: 'Cena Internacional',
      price: 36.32,
      startTime: '20:00',
      endTime: '22:00'
    },
    {
      name: 'Alojamiento Internacional',
      price: 144.96
    },
    {
      name: 'Equipaje',
      price: 30.37
    },
    {
      name: 'Transfer Diurno',
      price: 20.03,
      startTime: '06:00',
      endTime: '22:00'
    },
    {
      name: 'Transfer Nocturno',
      price: 27.32,
      startTime: '22:00',
      endTime: '06:00'
    }
  ];

  for (const extra of extras) {
    await prisma.extra.create({
      data: extra
    });
  }
}

async function seedSeasonsAndDays() {
  // Seed Seasons and SeasonDays
  const seasons = [
    { name: 'Low', adjustmentPercentage: -0.1, color: '#00FF00', startDate: '2024-09-12', endDate: '2024-11-11' },
    { name: 'Medium', adjustmentPercentage: 0.0, color: '#FFFF00', startDate: '2024-11-12', endDate: '2025-01-12' },
    { name: 'High', adjustmentPercentage: 0.2, color: '#FF0000', startDate: '2025-01-13', endDate: '2025-06-01' }
  ];

  for (const season of seasons) {
    const seededSeason = await prisma.season.upsert({
      where: { name: season.name },
      update: {
        adjustmentPercentage: season.adjustmentPercentage,
        color: season.color
      },
      create: {
        name: season.name,
        adjustmentPercentage: season.adjustmentPercentage,
        color: season.color
      }
    });

    // Seed SeasonDays for each season with a unique range
    const daysInRange = getDaysInRange(season.startDate, season.endDate);
    for (const day of daysInRange) {
      await prisma.seasonDay.upsert({
        where: { day: new Date(day) },
        update: {
          seasonId: seededSeason.id
        },
        create: {
          day: new Date(day),
          seasonId: seededSeason.id
        }
      });
    }
  }
}

function getDaysInRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateArray = [];

  const currentDate = start;
  while (currentDate <= end) {
    dateArray.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateArray;
}

async function main() {
  await seedBaseData();
  await seedSeasonsAndDays();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
