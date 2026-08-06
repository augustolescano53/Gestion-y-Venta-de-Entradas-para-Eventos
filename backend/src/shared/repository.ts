export interface Repository<T> {
  findAll(): T[]
  findOne(id: string): T | undefined
  add(item: T): T
  update(id: string, item: Partial<T>): T | undefined
  delete(id: string): T | undefined
}
