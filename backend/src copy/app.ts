import express from 'express'
import { organizadorRouter } from './organizador/organizador.routes.js'

const app = express()
const port = 3000

app.use(express.json())
app.use("/api/organizador", organizadorRouter)
app.get('/', (_req, res) => {
  res.json({
    message: 'Hola MUNDO!',
  })
})

app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`)
})