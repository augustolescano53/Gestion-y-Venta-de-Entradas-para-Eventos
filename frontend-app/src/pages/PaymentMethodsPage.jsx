import { useEffect, useState } from 'react';
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '../api/paymentMethods.js';

const EMPTY_FORM = { type: '' };

function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadPaymentMethods() {
    setLoading(true);
    setListError(null);
    try {
      const data = await getPaymentMethods();
      setPaymentMethods(data);
    } catch (error) {
      setListError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  function openCreateForm() {
    setEditingPaymentMethod(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(paymentMethod) {
    setEditingPaymentMethod(paymentMethod);
    setFormData({ type: paymentMethod.type });
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingPaymentMethod(null);
    setFormError(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  function validateForm() {
    if (!formData.type.trim()) {
      return 'El tipo de medio de pago es obligatorio.';
    }
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = { type: formData.type.trim() };

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingPaymentMethod) {
        await updatePaymentMethod(editingPaymentMethod.id, payload);
        setSuccessMessage('Medio de pago actualizado correctamente.');
      } else {
        await createPaymentMethod(payload);
        setSuccessMessage('Medio de pago creado correctamente.');
      }
      closeForm();
      await loadPaymentMethods();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(paymentMethod) {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar "${paymentMethod.type}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeletingId(paymentMethod.id);
    setListError(null);
    try {
      await deletePaymentMethod(paymentMethod.id);
      setPaymentMethods((previous) => previous.filter((pm) => pm.id !== paymentMethod.id));
      setSuccessMessage('Medio de pago eliminado correctamente.');
    } catch (error) {
      setListError(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <div className="page-toolbar">
        <h2>Medios de pago</h2>
        <button type="button" className="btn btn--primary" onClick={openCreateForm}>
          + Nuevo medio de pago
        </button>
      </div>

      {successMessage && <p className="banner banner--success">{successMessage}</p>}
      {listError && (
        <p className="banner banner--error">
          {listError}{' '}
          <button type="button" className="btn" onClick={loadPaymentMethods}>
            Reintentar
          </button>
        </p>
      )}

      {isFormOpen && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>{editingPaymentMethod ? 'Editar medio de pago' : 'Nuevo medio de pago'}</h3>

          {formError && <p className="banner banner--error">{formError}</p>}

          <label className="field">
            <span>Tipo</span>
            <input
              name="type"
              placeholder="Ej: Efectivo, Tarjeta de crédito..."
              value={formData.type}
              onChange={handleChange}
            />
          </label>

          <div className="form-actions">
            <button type="button" onClick={closeForm} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Cargando medios de pago...</p>
      ) : paymentMethods.length === 0 ? (
        <p>Todavía no hay medios de pago cargados.</p>
      ) : (
        <ul className="card-list">
          {paymentMethods.map((paymentMethod) => (
            <li key={paymentMethod.id} className="card">
              <h3>{paymentMethod.type}</h3>
              <div className="card__actions">
                <button type="button" onClick={() => openEditForm(paymentMethod)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn--danger"
                  onClick={() => handleDelete(paymentMethod)}
                  disabled={deletingId === paymentMethod.id}
                >
                  {deletingId === paymentMethod.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default PaymentMethodsPage;
