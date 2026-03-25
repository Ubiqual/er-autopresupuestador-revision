import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// TODO: delete this when nothing on the apps depends on old names, also icons should not depend on db name
export function formatName(name: string) {
  return name === 'Traslados'
    ? 'Otros traslados de ida o vuelta (sin disposición)'
    : name === 'Transfer tren'
      ? 'transfer estación FFCC'
      : name === 'Excursiones'
        ? 'Excursiones y visitas ciudad'
        : name === 'Viajes'
          ? 'Viajes de más de un día'
          : name;
}
