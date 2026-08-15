import express from 'express';
import { organizerRouter } from './organizer/organizer.routes.js';
import { participantRouter } from './participant/participant.routes.js';
import { paymentmethodRouter } from './paymentmethod/paymentmethod.routes.js';
import { venueRouter } from './venue/venue.routes.js';
import { eventRouter } from './event/event.routes.js';

const app = express();
const port = 3000;

app.use(express.json());

app.use('/api/organizer', organizerRouter);
app.use('/api/participant', participantRouter);
app.use('/api/paymentmethod', paymentmethodRouter);
app.use('/api/venue', venueRouter);
app.use('/api/event', eventRouter);

app.get('/', (_req, res) => {
  res.json({
    message: 'Hello WORLD!',
  });
});

app.use((_, res) => {
  res.status(404).send({ message: 'Resource not found' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
