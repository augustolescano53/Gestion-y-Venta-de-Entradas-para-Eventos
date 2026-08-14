import { Repository } from '../shared/repository.js';
import { Venue } from './venue.entity.js';

const venues = [new Venue('1', 'Teatro Broadway')];

export class VenueRepository implements Repository<Venue> {
  public findAll(): Venue[] | undefined {
    return venues;
  }
  public findOne(item: { id: string }): Venue | undefined {
    return venues.find((venue) => venue.id === item.id);
  }
  public add(item: Venue): Venue | undefined {
    venues.push(item);
    return item;
  }
  public update(item: Venue): Venue | undefined {
    const venueIdx = venues.findIndex((venue) => venue.id === item.id);

    if (venueIdx !== -1) {
      venues[venueIdx] = {
        ...venues[venueIdx],
        ...item,
      };
    }

    return venues[venueIdx];
  }
  public delete(item: { id: string }): Venue | undefined {
    const venueIdx = venues.findIndex((venue) => venue.id === item.id);

    if (venueIdx !== -1) {
      const deletedVenue = venues[venueIdx];
      venues.splice(venueIdx, 1);
      return deletedVenue;
    }
  }
}
