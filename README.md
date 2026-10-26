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
* [frontend app](https://github.com/augustolescano53/Gestion-y-Venta-de-Entradas-para-Eventos/tree/main/frontend-app)
* [backend app](https://github.com/augustolescano53/Gestion-y-Venta-de-Entradas-para-Eventos/tree/main/backend)


## Tema
### Descripción
*Una plataforma on-line que permite autogestionar eventos, vender sus entradas y ofrecer a los participantes experiencias únicas. 
Los organizadores dispondrán de reportes actualizados desde la venta hasta la asistencia al evento.*

### Modelo
<img width="1192" height="899" alt="Copia de MD TP Entradas (1)" src="https://github.com/user-attachments/assets/a5bb5ac2-6ffb-4684-8e89-0ac3f0fc3874" />



## Alcance Funcional 

### Alcance Mínimo

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Organizador<br>2. CRUD Participante<br>3. CRUD FormaDePago<br>4. CRUD LugarEvento|
|CRUD dependiente|1. CRUD TipoDeEntrada {depende de} CRUD LugarEvento<br>2. CRUD Evento {depende de} CRUD LugarEvento|
|Listado<br>+<br>detalle| 1. Próximos y anteriores eventos del usuario, muestra: nombre, lugar, fecha, hora, estado (sólo si está cancelado) <br> 2. Listado de tipo de entrada filtrado por disponibilidad, muestra nombre de tipo de entrada (atributo location) y añade una aclaración si está agotado |
|CUU/Epic|1. Vender entrada<br>2. Generar entrada QR|


Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD |1. CRUD TipoDeEntrada<br>2. CRUD Participante<br>3. CRUD Organizador<br>4. CRUD Evento<br>5. CRUD LugarEvento<br>6. CRUD Precio<br>7. CRUD Entrada<br>8. CRUD Venta|
|CUU/Epic|1. Vender entrada<br>2. Generar entrada QR <br>3. Escanear entrada QR<br>4. Agotar evento|


### Alcance Adicional Voluntario

|Req|Detalle|
|:-|:-|
|Listados |1. Asistencia a evento filtrado por nombre, muestra: nombre, cantidad total de asistentes, cantidad por tipo de entrada, fecha, lugar <br>2. Entradas vendidas de un evento filtrado por nombre, muestra: nombre, lugar, fecha, hora, cantidad total de ventas|
|CUU/Epic|1. Cancelar evento<br>2. Reprogramar evento|
|Otros|1. Envío de recordatorio de evento por email al participante|


## Ejecución local

1. Base de datos: contenedor MySQL (Percona) en `localhost:3308`, base `event_management`, usuario `dsw` / `dsw`.
2. Backend: `cd backend && pnpm install && pnpm start:dev` (API en `http://localhost:3000/api`). El esquema se actualiza solo al iniciar.
3. Frontend: `cd frontend-app && pnpm install && pnpm dev` (`http://localhost:5173`).
4. Tests del backend (con el backend corriendo): `cd backend && pnpm test`.

### Roles y autenticación

Los usuarios están en la tabla `user` (herencia por la columna `type`): `participant`, `organizer` y `admin`.
`POST /api/user/login` devuelve un JWT que el frontend envía en `Authorization: Bearer <token>`.

|Rol|Acceso|
|:-|:-|
|Visitante|Inicio, detalle de eventos, registro y login|
|Participante|Compra de entradas, "Mis entradas" y su cuenta|
|Organizador|Sus eventos (crear, editar, anular) y su cuenta|
|Administrador|Panel de administración: todas las CRUD (`/lugares`, `/medios-de-pago`, `/organizadores`, `/participantes`, `/tipos-de-entrada`, `/eventos`, `/entradas`, `/administradores`) y su cuenta|

El backend valida el rol en cada operación (no alcanza con ocultar enlaces).

**Administrador inicial:** si no existe ninguno, el backend crea uno al iniciar con `ADMIN_EMAIL` / `ADMIN_PASSWORD`
(por defecto `admin@pogo.com` / `admin123`). Variables opcionales: `JWT_SECRET` (firma de los tokens; obligatorio cambiarla fuera de desarrollo).
