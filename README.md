# tp_dsw-rodriguez-lescano-faldani-calcaterra
Comisión 301

# Propuesta TP DSW

## Grupo
### Integrantes
* 54098 - Rodriguez, Jimena
* 54401 - Lescano, Augusto
* 54569 - Calcaterra, Sol
* 54716 - Faldani Rangel, Ana

### Repositorios
* [frontend app](http://hyperlinkToGihubOrGitlab)
* [backend app](http://hyperlinkToGihubOrGitlab)
*Nota*: si utiliza un monorepo indicar un solo link con fullstack app.

## Tema
### Descripción
*Plataforma de eventos que permite a organizadores crear, publicar y administrar eventos, así como vender entradas en línea. Los participantes pueden inscribirse, recibir su ticket y asistir al evento, mientras que los organizadores obtienen información sobre ventas y asistencia.*

### Modelo
![imagen del modelo]()

*Nota*: incluir un link con la imagen de un modelo, puede ser modelo de dominio, diagrama de clases, DER. Si lo prefieren pueden utilizar diagramas con [Mermaid](https://mermaid.js.org) en lugar de imágenes.

## Alcance Funcional 

### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Entrada<br>2. CRUD Participante<br>3. CRUD Organizador<br>4. CRUD LugarEvento|
|CRUD dependiente|1. CRUD Tipo Entrada {depende de} CRUD Entrada<br>2. CRUD Evento {depende de} CRUD LugarEvento|
|Listado<br>+<br>detalle| 1. Listado de eventos filtrado por disponibilidad, muestra nombre y lugar => detalle CRUD Evento<br> 2. Listado de entradas filtrado por disponibilidad, muestra tipo de entrada y cantidad disponible=> detalle CRUD Entrada|
|CUU/Epic|1. Crear evento<br>2. Vender entrada|


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD Tipo Entrada <br>2. CRUD Participante<br>3. CRUD Organizador<br>4. CRUD Evento<br>5. CRUD LugarEvento<br>6. CRUD Empleado<br>7. CRUD Cliente|
|CUU/Epic|1. Reservar una habitación para la estadía<br>2. Realizar el check-in de una reserva<br>3. Realizar el check-out y facturación de estadía y servicios|


### Alcance Adicional Voluntario

*Nota*: El Alcance Adicional Voluntario es opcional, pero ayuda a que la funcionalidad del sistema esté completa y será considerado en la nota en función de su complejidad y esfuerzo.

|Req|Detalle|
|:-|:-|
|Listados |1. Estadía del día filtrado por fecha muestra, cliente, habitaciones y estado <br>2. Reservas filtradas por cliente muestra datos del cliente y de cada reserve fechas, estado cantidad de habitaciones y huespedes|
|CUU/Epic|1. Consumir servicios<br>2. Cancelación de reserva|
|Otros|1. Envío de recordatorio de reserva por email|
