import { Entity } from '@mikro-orm/core'
import { User } from '../user/user.entity.js'

// Administrador: mismos datos que cualquier usuario, en la tabla user con
// type = 'admin'. Gestiona todas las CRUD del panel de administración.
@Entity({ discriminatorValue: 'admin' })
export class Admin extends User {}
