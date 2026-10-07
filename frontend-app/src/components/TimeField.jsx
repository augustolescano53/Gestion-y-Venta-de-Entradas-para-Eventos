import { useId } from 'react';
import FormField from './FormField.jsx';

const SUGGESTED_MINUTES = ['00', '15', '30', '45'];
const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));

// Las sugerencias se arman según la hora ya escrita ("20" -> 20:00, 20:15,
// 20:30, 20:45). Son solo sugerencias: se puede escribir cualquier HH:MM y
// el valor nunca se redondea ni se reemplaza.
function suggestionsFor(value) {
  const hour = value.slice(0, 2);
  const hours = HOURS.includes(hour) ? [hour] : HOURS;
  return hours.flatMap((h) => SUGGESTED_MINUTES.map((m) => `${h}:${m}`));
}

function TimeField({ label, name, value, onChange, error, hint }) {
  const listId = useId();
  return (
    <FormField label={label} error={error} hint={hint ?? 'Formato 24 h (HH:MM). Podés elegir una sugerencia o escribir otro horario.'}>
      <input
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="HH:MM"
        maxLength={5}
        list={listId}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
      />
      <datalist id={listId}>
        {suggestionsFor(value).map((time) => (
          <option key={time} value={time} />
        ))}
      </datalist>
    </FormField>
  );
}

export default TimeField;
