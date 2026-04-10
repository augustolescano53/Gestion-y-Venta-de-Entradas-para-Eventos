# Gestión y venta de entradas para eventos
Comisión 301

# Propuesta TP DSW

## Grupo
### Integrantes
* 54098 - Rodriguez, Jimena
* 54401 - Lescano, Augusto
* 54569 - Calcaterra, Sol
* 54716 - Faldani Rangel, Ana

### Repositorios
* [frontend app](https://github.com/augustolescano53/tp_dsw-rodriguez-lescano-faldani-calcaterra/blob/91352d9fd3551bbd3a6bf8e6252d35e4becb4328/frontend)
* [backend app](https://github.com/augustolescano53/tp_dsw-rodriguez-lescano-faldani-calcaterra/blob/dabcd507cef227b9b327ee23ceb026d0cce733b5/backend)


## Tema
### Descripción
*Una plataforma on-line que permite autogestionar eventos, vender sus entradas y ofrecer a los participantes experiencias únicas. 
Los organizadores dispondrán de reportes actualizados desde la venta hasta la asistencia al evento.*

### Modelo
<img width="1123" height="742" alt="MD TP Entradas drawio (1)" src="https://github.com/user-attachments/assets/bba3ee5c-3c01-4d72-abf8-f82b7478e486" />


## Alcance Funcional 

### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Entrada<br>2. CRUD Participante<br>3. CRUD Organizador<br>4. CRUD LugarEvento|
|CRUD dependiente|1. CRUD TipoDeEntrada {depende de} CRUD Entrada<br>2. CRUD Evento {depende de} CRUD LugarEvento|
|Listado<br>+<br>detalle| 1. Listado de eventos filtrado por disponibilidad, muestra nombre y lugar => detalle CRUD Evento<br> 2. Listado de entradas filtrado por disponibilidad, muestra tipo de entrada y cantidad disponible=> detalle CRUD Entrada|
|CUU/Epic|1. Crear evento<br>2. Vender entrada|


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD TipoDeEntrada<br>2. CRUD Participante<br>3. CRUD Organizador<br>4. CRUD Evento<br>5. CRUD LugarEvento<br>6. CRUD Precio<br>7. CRUD Entrada<br>8. CRUD Venta|
|CUU/Epic|1. Crear evento<br>2. Vender entrada<br>3. Validar entrada<br>4. Agotar evento|


### Alcance Adicional Voluntario

|Req|Detalle|
|:-|:-|
|Listados |1. Próximos eventos del usuario, muestra: nombre, lugar, fecha, hora, estado <br>2. Asistencia a evento filtrado por nombre, muestra: nombre, cantidad total de asistentes, cantidad por tipo de entrada, fecha, lugar <br>3.Entradas vendidas de un evento filtrado por nombre, muestra: nombre, lugar, fecha, hora, cantidad total de ventas.|
|CUU/Epic|1. Cancelar evento<br>2. Reprogramar evento|
|Otros|1. Envío de recordatorio de evento por email al participante|
