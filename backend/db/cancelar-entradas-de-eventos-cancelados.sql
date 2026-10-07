-- Pasa a "cancelada" las entradas de los eventos que se anularon antes de
-- que existiera ese estado. Guarda el estado anterior en previous_status y
-- no modifica participante, medio de pago ni fecha de compra.
-- Ejecutar después de levantar el backend una vez (crea previous_status).
-- Es idempotente.

USE event_management;

UPDATE ticket t
  JOIN event e ON e.id_event = t.event_id_event AND e.venue_id = t.event_venue_id
   SET t.previous_status = t.status, t.status = 'cancelada'
 WHERE e.status = 'cancelled' AND t.status <> 'cancelada';
