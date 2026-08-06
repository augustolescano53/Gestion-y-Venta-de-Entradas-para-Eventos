import { OrganizadorRepository } from "./organizador.repository.js";
import { Organizador } from "./organizador.entity.js";
const repository = new OrganizadorRepository();
function sanitizeOrganizadorInput(req, res, next) {
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        OrganizadorClass: req.body.OrganizadorClass,
        apellido: req.body.apellido,
        mail: req.body.mail,
        dni: req.body.dni,
        id: req.body.id,
        contrasena: req.body.contrasena,
    };
    Object.keys(req.body.sanitizedInput).forEach((key) => {
        if (req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key];
        }
    });
    next();
}
function findAll(req, res) {
    res.json({ data: repository.findAll() });
}
function findOne(req, res) {
    const organizador = repository.findOne({ id: req.params.id });
    if (!organizador) {
        return res.status(404).send({ message: 'Organizador not found' });
    }
    res.json({ data: organizador });
}
function add(req, res) {
    const input = req.body.sanitizedInput;
    const organizadorInput = new Organizador(input.nombre, input.apellido, input.mail, input.id, input.dni, input.contrasena);
    const organizador = repository.add(organizadorInput);
    res.status(201).send({ message: 'Organizador created', data: organizador });
}
function update(req, res) {
    req.body.sanitizedInput.id = req.params.id;
    const organizador = repository.update(req.body.sanitizedInput);
    if (!organizador) {
        return res.status(404).send({ message: 'Organizador not found' });
    }
    return res.status(200).send({ message: 'Organizador updated successfully', data: organizador });
}
function remove(req, res) {
    const id = req.params.id;
    const organizador = repository.delete({ id });
    if (!organizador) {
        res.status(404).send({ message: 'Organizador not found' });
    }
    else {
        res.status(200).send({ message: 'Organizador deleted successfully' });
    }
}
export { sanitizeOrganizadorInput, findAll, findOne, add, update, remove };
//# sourceMappingURL=organizador.controller.js.map