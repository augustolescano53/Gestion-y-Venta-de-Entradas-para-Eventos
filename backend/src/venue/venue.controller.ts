import { Request, Response, NextFunction } from 'express';
import { Venue } from './venue.entity.js';
import { orm } from '../shared/db/orm.js';
import { isValidHttpUrl } from '../shared/url.js';
import { HttpError, sendError } from '../shared/httpError.js';
import { sameKey, trimText } from '../shared/text.js';

const em = orm.em;

function sanitizeVenueInput(req: Request, res: Response, next: NextFunction) {
  const address = req.body.address ?? {};

  req.body.sanitizedInput = {
    name: trimText(req.body.name),
    address: {
      street: trimText(address.street),
      streetNumber: trimText(address.streetNumber),
      postalCode: trimText(address.postalCode),
      locality: trimText(address.locality),
      province: trimText(address.province),
      googleMapsUrl: address.googleMapsUrl,
    },
  };

  // Dentro del embeddable, MikroORM prefiere que la propiedad no exista a
  // que valga undefined.
  if (req.body.sanitizedInput.address.googleMapsUrl === undefined) {
    delete req.body.sanitizedInput.address.googleMapsUrl;
  }

  next();
}

function validateVenueInput(req: Request, res: Response, next: NextFunction) {
  const { name, address } = req.body.sanitizedInput;
  const errors: string[] = [];

  if (!isNonEmptyString(name)) {
    errors.push('El nombre del lugar es obligatorio.');
  }

  const requiredAddressFields: Array<[string, string]> = [
    ['street', 'La calle es obligatoria.'],
    ['streetNumber', 'El número es obligatorio.'],
    ['postalCode', 'El código postal es obligatorio.'],
    ['locality', 'La localidad es obligatoria.'],
    ['province', 'La provincia es obligatoria.'],
  ];

  for (const [field, message] of requiredAddressFields) {
    if (!isNonEmptyString(address[field])) {
      errors.push(message);
    }
  }

  if (address.googleMapsUrl !== undefined && !isValidHttpUrl(address.googleMapsUrl)) {
    errors.push('El enlace de Google Maps debe ser una URL válida (http o https).');
  }

  if (errors.length > 0) {
    return res.status(400).send({ message: errors.join(' ') });
  }

  next();
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

async function findAll(req: Request, res: Response) {
  try {
    const venues = await em.find(Venue, {});
    res.json({ data: venues });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);
    const venue = await em.findOneOrFail(
      Venue,
      { id },
      { populate: ['ticketTypes'] },
    );
    res.json({ data: venue });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

const ADDRESS_FIELDS = ['street', 'streetNumber', 'postalCode', 'locality', 'province'] as const;

// Un lugar está repetido si otro tiene el mismo nombre en la misma localidad
// y provincia, o la misma dirección completa aunque se llame distinto (sin
// distinguir mayúsculas, acentos ni espacios). id: el lugar que se edita.
async function checkDuplicate(input: { name: string; address: Record<string, string> }, id?: number) {
  const existing = await em.find(Venue, {});
  const others = existing.filter((venue) => venue.id !== id);
  const { address } = input;

  const sameName = others.find(
    (venue) =>
      sameKey(venue.name, input.name) &&
      sameKey(venue.address.locality, address.locality) &&
      sameKey(venue.address.province, address.province),
  );
  if (sameName) {
    const message = `Ya existe un lugar llamado "${sameName.name}" en ${sameName.address.locality}, ${sameName.address.province}.`;
    throw new HttpError(409, message, { name: message });
  }

  const sameAddress = others.find((venue) =>
    ADDRESS_FIELDS.every((field) => sameKey(venue.address[field], address[field])),
  );
  if (sameAddress) {
    const message = `Ya hay un lugar registrado en esa dirección ("${sameAddress.name}").`;
    throw new HttpError(409, message, { address: message });
  }
}

async function add(req: Request, res: Response) {
  try {
    await checkDuplicate(req.body.sanitizedInput);
    const venue = em.create(Venue, req.body.sanitizedInput);
    await em.flush();
    res.status(201).send({ message: 'Venue created', data: venue });
  } catch (error) {
    sendError(res, error);
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);
    const venueToUpdate = await em.findOneOrFail(Venue, { id });
    await checkDuplicate(req.body.sanitizedInput, id);
    em.assign(venueToUpdate, req.body.sanitizedInput);
    await em.flush();
    res.status(200).send({
      message: 'Venue updated successfully',
      data: venueToUpdate,
    });
  } catch (error) {
    sendError(res, error, 'El lugar no existe.');
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id as string);
    const venue = await em.findOneOrFail(
      Venue,
      { id },
      { populate: ['events', 'ticketTypes'] },
    );

    if (venue.events.length > 0 || venue.ticketTypes.length > 0) {
      return res.status(409).send({
        message:
          'No se puede eliminar el lugar porque tiene eventos o tipos de entrada asociados.',
      });
    }

    await em.removeAndFlush(venue);
    res.status(200).send({ message: 'Venue deleted successfully' });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
}

export {
  sanitizeVenueInput,
  validateVenueInput,
  findAll,
  findOne,
  add,
  update,
  remove,
};
