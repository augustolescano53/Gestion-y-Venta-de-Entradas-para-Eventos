import crypto from 'node:crypto';
export class Usuario {
    constructor(nombre, apellido, mail, id = crypto.randomUUID(), dni, contrasena) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.mail = mail;
        this.id = id;
        this.dni = dni;
        this.contrasena = contrasena;
    }
}
//# sourceMappingURL=usuario.entity.js.map