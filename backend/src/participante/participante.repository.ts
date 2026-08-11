import { Repository } from '../shared/repository.js';
import { Participante } from './participante.entity.js';

const participante = [
  new Participante(
    'Jimena',
    'Rodriguez',
    'jimena.rodriguez@example.com',
    '7b3e8c21-5f64-4a92-bd17-9c6e2f4a8b53',
    '87654321',
    'contrasena456',
  ),
];
export class ParticipanteRepository implements Repository<Participante> {
  public findAll(): Participante[] | undefined {
    return participante;
  }

  public findOne(item: { id: string }): Participante | undefined {
    return participante.find((par) => par.id === item.id);
  }

  public add(item: Participante): Participante | undefined {
    participante.push(item);
    return item;
  }

  public update(item: Participante): Participante | undefined {
    const participanteIdx = participante.findIndex((par) => par.id === item.id);

    if (participanteIdx !== -1) {
      participante[participanteIdx] = {
        ...participante[participanteIdx],
        ...item,
      };
    }
    return participante[participanteIdx];
  }

  public delete(item: { id: string }): Participante | undefined {
    const participanteIdx = participante.findIndex((par) => par.id === item.id);

    if (participanteIdx !== -1) {
      const deletedParticipante = participante[participanteIdx];
      participante.splice(participanteIdx, 1);
      return deletedParticipante;
    }
  }
}
