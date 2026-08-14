import { Repository } from '../shared/repository.js';
import { Event } from './event.entity.js';

const event = [
  new Event(
    new Date(),
    '09:00',
    '17:00',
    '8a7c3e91-5f24-4b68-9d13-2e7a6c4f0b52',
    'imagen.jpg',
    'Descripción del evento',
    'disponible',
  ),
];

export class EventRepository implements Repository<Event> {
  public findAll(): Event[] | undefined {
    return event;
  }

  public findOne(item: { id: string }): Event | undefined {
    return event.find((eve) => eve.id === item.id);
  }

  public add(item: Event): Event | undefined {
    event.push(item);
    return item;
  }

  public update(item: Event): Event | undefined {
    const eventIdx = event.findIndex((eve) => eve.id === item.id);

    if (eventIdx !== -1) {
      event[eventIdx] = { ...event[eventIdx], ...item };
    }
    return event[eventIdx];
  }

  public delete(item: { id: string }): Event | undefined {
    const eventIdx = event.findIndex((eve) => eve.id === item.id);

    if (eventIdx !== -1) {
      const deletedEvent = event[eventIdx];
      event.splice(eventIdx, 1);
      return deletedEvent;
    }
  }
}
