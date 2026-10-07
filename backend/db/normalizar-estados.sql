-- Normaliza los estados cargados antes de que existieran los estados fijos
-- de evento y de entrada. Se puede ejecutar más de una vez: los registros
-- que ya tienen un estado válido no cambian.
--
-- Los cambios de columnas (user.birth_date, FK de ticket.payment_method_id)
-- los aplica el backend al arrancar (updateSchema). Este script no borra
-- ni crea registros.

USE event_management;

-- Eventos: se guardan en inglés (scheduled, sold_out, finished, cancelled).
UPDATE event SET status = 'scheduled'
 WHERE LOWER(status) IN ('programado', 'reprogramado', 'rescheduled');
UPDATE event SET status = 'cancelled'
 WHERE LOWER(status) IN ('cancelado', 'anulado', 'canceled');
UPDATE event SET status = 'sold_out'
 WHERE LOWER(status) IN ('agotado', 'soldout', 'sold out');
UPDATE event SET status = 'finished'
 WHERE LOWER(status) IN ('finalizado', 'terminado');
-- Cualquier otro valor de texto libre pasa a Programado. Si ya terminó, el
-- backend lo pasa a Finalizado en menos de un minuto.
UPDATE event SET status = 'scheduled'
 WHERE status NOT IN ('scheduled', 'sold_out', 'finished', 'cancelled');

-- Entradas: se guardan en español (disponible, vendida, escaneada).
UPDATE ticket SET status = 'escaneada'
 WHERE LOWER(status) IN ('escaneada', 'usada', 'utilizada');
UPDATE ticket SET status = 'vendida'
 WHERE LOWER(status) IN ('vendida', 'pagada', 'pagado');
UPDATE ticket SET status = 'disponible'
 WHERE LOWER(status) = 'disponible';
-- Otros valores (por ejemplo, "Reservado"): si la entrada tiene un
-- participante se considera vendida y si no, disponible.
UPDATE ticket SET status = IF(participant_id IS NULL, 'disponible', 'vendida')
 WHERE status NOT IN ('disponible', 'vendida', 'escaneada');
-- Entradas que quedaron inconsistentes (vendidas sin participante o sin
-- medio de pago, o disponibles con datos de compra). No se corrigen solas
-- para no borrar datos: se listan para revisarlas desde la pantalla de
-- Entradas. Si la consulta no devuelve filas, no hay nada que revisar.
SELECT id, status, participant_id, payment_method_id, purchase_date
  FROM ticket
 WHERE (status IN ('vendida', 'escaneada') AND (participant_id IS NULL OR payment_method_id IS NULL))
    OR (status = 'disponible' AND (participant_id IS NOT NULL OR payment_method_id IS NOT NULL));
