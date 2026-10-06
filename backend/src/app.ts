import express from 'express';
import cors from 'cors';
import { organizerRouter } from './organizer/organizer.routes.js';
import { participantRouter } from './participant/participant.routes.js';
import { paymentmethodRouter } from './paymentmethod/paymentmethod.routes.js';
import { venueRouter } from './venue/venue.routes.js';
import { ticketRouter } from './ticket/ticket.routes.js';
import { allEventsRouter } from './event/event.routes.js';
import { startEventStatusScheduler } from './event/event.scheduler.js';
import { orm, syncSchema } from './shared/db/orm.js'
import { RequestContext } from '@mikro-orm/core'
import 'reflect-metadata'


const app = express();
const port = 3000;

app.use(express.json());

// El frontend (Vite, :5173) corre en otro origen que la API.
app.use(cors({ origin: 'http://localhost:5173' }));

app.use((req, res, next) => {
  RequestContext.create(orm.em, next)
})

app.use('/api/organizer', organizerRouter);
app.use('/api/participant', participantRouter);
app.use('/api/paymentmethod', paymentmethodRouter);
app.use('/api/venue', venueRouter);
app.use('/api/ticket', ticketRouter);
app.use('/api/event', allEventsRouter);

app.get('/', (_req, res) => {
  res.json({
    message: 'Hello WORLD!',
  });
});

app.use((_, res) => {
  res.status(404).send({ message: 'Resource not found' });
});

await syncSchema()

startEventStatusScheduler()

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
