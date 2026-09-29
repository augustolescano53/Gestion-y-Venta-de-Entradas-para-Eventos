import express from 'express';
import cors from 'cors';
import { organizerRouter } from './organizer/organizer.routes.js';
import { participantRouter } from './participant/participant.routes.js';
import { paymentmethodRouter } from './paymentmethod/paymentmethod.routes.js';
import { venueRouter } from './venue/venue.routes.js';
import { ticketRouter } from './ticket/ticket.routes.js';
import { orm, syncSchema } from './shared/db/orm.js'
import { RequestContext } from '@mikro-orm/core'
import 'reflect-metadata'


const app = express();
const port = 3000;

app.use(express.json());

// El frontend corre en otro origen (Vite en :5173) que el backend (:3000),
// así que el navegador aplica la política de CORS. Este middleware agrega
// las cabeceras que le dicen al navegador "está permitido que ese origen
// consuma esta API".
app.use(cors({ origin: 'http://localhost:5173' }));

app.use((req, res, next) => {
  RequestContext.create(orm.em, next)
})

app.use('/api/organizer', organizerRouter);
app.use('/api/participant', participantRouter);
app.use('/api/paymentmethod', paymentmethodRouter);
app.use('/api/venue', venueRouter);
app.use('/api/ticket', ticketRouter);

app.get('/', (_req, res) => {
  res.json({
    message: 'Hello WORLD!',
  });
});

app.use((_, res) => {
  res.status(404).send({ message: 'Resource not found' });
});

await syncSchema()

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
