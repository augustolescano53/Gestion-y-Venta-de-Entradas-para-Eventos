import { Repository } from '../shared/repository.js';
import { Participant } from './participant.entity.js';

const participant = [
  new Participant(
    'Jimena',
    'Rodriguez',
    'jimena.rodriguez@example.com',
    '7b3e8c21-5f64-4a92-bd17-9c6e2f4a8b53',
    '87654321',
    'contrasena456',
  ),
];
export class ParticipantRepository implements Repository<Participant> {
  public findAll(): Participant[] | undefined {
    return participant;
  }

  public findOne(item: { id: string }): Participant | undefined {
    return participant.find((par) => par.id === item.id);
  }

  public add(item: Participant): Participant | undefined {
    participant.push(item);
    return item;
  }

  public update(item: Participant): Participant | undefined {
    const participantIdx = participant.findIndex((par) => par.id === item.id);

    if (participantIdx !== -1) {
      participant[participantIdx] = {
        ...participant[participantIdx],
        ...item,
      };
    }
    return participant[participantIdx];
  }

  public delete(item: { id: string }): Participant | undefined {
    const participantIdx = participant.findIndex((par) => par.id === item.id);

    if (participantIdx !== -1) {
      const deletedParticipant = participant[participantIdx];
      participant.splice(participantIdx, 1);
      return deletedParticipant;
    }
  }
}
