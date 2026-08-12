import { Repository } from '../shared/repository.js';
import { LugarEvento } from './lugarevento.entity.js';

const lugaresEvento = [new LugarEvento('1', 'Teatro Broadway')];

export class LugarEventoRepository implements Repository<LugarEvento> {
  public findAll(): LugarEvento[] | undefined {
    return lugaresEvento;
  }
  public findOne(item: { id: string }): LugarEvento | undefined {
    return lugaresEvento.find((lugar) => lugar.id === item.id);
  }
  public add(item: LugarEvento): LugarEvento | undefined {
    lugaresEvento.push(item);
    return item;
  }
  public update(item: LugarEvento): LugarEvento | undefined {
    const lugarIdx = lugaresEvento.findIndex((lugar) => lugar.id === item.id);

    if (lugarIdx !== -1) {
      lugaresEvento[lugarIdx] = {
        ...lugaresEvento[lugarIdx],
        ...item,
      };
    }

    return lugaresEvento[lugarIdx];
  }
  public delete(item: { id: string }): LugarEvento | undefined {
    const lugarIdx = lugaresEvento.findIndex((lugar) => lugar.id === item.id);

    if (lugarIdx !== -1) {
      const deletedLugar = lugaresEvento[lugarIdx];
      lugaresEvento.splice(lugarIdx, 1);
      return deletedLugar;
    }
  }
}
