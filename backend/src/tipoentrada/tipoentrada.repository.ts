import { Repository } from "../shared/repository.js";
import { TipoEntrada } from "../tipoentrada/tipoentrada.entity.js"

const tipoEntrada = [ 
  new TipoEntrada(
    3,
    "Palco",
    true,
    "4f5b2b31-c2a9-4f7f-a2d8-7c4fe2d3cc91",) ]

export class TipoEntradaRepository implements Repository<TipoEntrada>{

  public findAll(): TipoEntrada[] | undefined {
    return tipoEntrada
  }

  public findOne(item: { id: string }): TipoEntrada | undefined {
    return tipoEntrada.find((tipoe) => tipoe.id === item.id)
  }

  public add(item: TipoEntrada): TipoEntrada | undefined {
    tipoEntrada.push(item)
    return item
  }

  public update(item: TipoEntrada): TipoEntrada | undefined {
      const tipoEntradaIdx = tipoEntrada.findIndex(tipoe => tipoe.id === item.id)

  if(tipoEntradaIdx !== -1){
    tipoEntrada[tipoEntradaIdx] = {...tipoEntrada[tipoEntradaIdx], ...item}
  }
  return tipoEntrada[tipoEntradaIdx]
  }

  public delete(item: { id: string; }): TipoEntrada | undefined {
    const tipoEntradaIdx = tipoEntrada.findIndex((tipoe) => tipoe.id === item.id)

  if(tipoEntradaIdx !== -1){
    const deletedTipoEntrada = tipoEntrada[tipoEntradaIdx]
    tipoEntrada.splice(tipoEntradaIdx,1)  
    return deletedTipoEntrada
  }
  }

}