import express from 'express';
import { organizadorRouter } from './organizador/organizador.routes.js';
import { participanteRouter } from './participante/participante.routes.js';
import { formadepagoRouter } from './formadepago/formadepago.routes.js';

const app = express();
const port = 3000;
app.use(express.json());

app.use('/api/organizador', organizadorRouter);
app.use('/api/formadepago', formadepagoRouter);
app.use('/api/participante', participanteRouter);

app.get('/', (_req, res) => {
  res.json({
    message: 'Hola MUNDO!',
  });
});

app.use((_, res) => {
  res.status(404).send({ message: 'Resource not found' });
});

app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
