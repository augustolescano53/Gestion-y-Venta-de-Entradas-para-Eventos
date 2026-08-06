import express from 'express'

const app = express()
const port = 3000

app.use(express.json())

app.get('/', (_req, res) => {
  res.json({
    message: 'Hola MUNDO!',
  })
})

app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`)
})