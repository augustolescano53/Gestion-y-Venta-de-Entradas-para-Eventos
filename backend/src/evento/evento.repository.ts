import { Repository } from '../shared/repository.js';
import { Evento } from './evento.entity.js';

const evento = [
  new Evento(
    new Date(),
    '09:00',
    '17:00',
    '8a7c3e91-5f24-4b68-9d13-2e7a6c4f0b52',
    'imagen.jpg',
    'Descripción del evento',
    'disponible',
  ),
];

export class EventoRepository implements Repository<Evento> {
  public findAll(): Evento[] | undefined {
    return evento;
  }

  public findOne(item: { id: string }): Evento | undefined {
    return evento.find((eve) => eve.id === item.id);
  }

  public add(item: Evento): Evento | undefined {
    evento.push(item);
    return item;
  }

  public update(item: Evento): Evento | undefined {
    const eventoIdx = evento.findIndex((eve) => eve.id === item.id);

    if (eventoIdx !== -1) {
      evento[eventoIdx] = { ...evento[eventoIdx], ...item };
    }
    return evento[eventoIdx];
  }

  public delete(item: { id: string }): Evento | undefined {
    const eventoIdx = evento.findIndex((eve) => eve.id === item.id);

    if (eventoIdx !== -1) {
      const deletedEvento = evento[eventoIdx];
      evento.splice(eventoIdx, 1);
      return deletedEvento;
    }
  }
}
