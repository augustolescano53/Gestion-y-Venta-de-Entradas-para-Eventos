import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '../../api/paymentMethods.js';
import { useConfirm } from '../../components/confirmDialog/useConfirm.js';
import { EMPTY_FORM } from './PaymentMethodsPage.data.js';
import {
  buildPaymentMethodPayload,
  deleteConfirmMessage,
  validatePaymentMethodForm,
} from './PaymentMethodsPage.helpers.js';
import { DELETE_CONFIRM, SUCCESS_MESSAGES } from './PaymentMethodsPage.consts.js';

function PaymentMethodsPage() {
  const confirm = useConfirm();

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validatePaymentMethodForm(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = buildPaymentMethodPayload(formData);

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingPaymentMethod) {
        await updatePaymentMethod(editingPaymentMethod.id, payload);
        toast.success(SUCCESS_MESSAGES.updated);
      } else {
        await createPaymentMethod(payload);
        toast.success(SUCCESS_MESSAGES.created);
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
    const confirmed = await confirm({
      ...DELETE_CONFIRM,
      message: deleteConfirmMessage(paymentMethod),
    });
    if (!confirmed) return;

    setDeletingId(paymentMethod.id);
    setListError(null);
    try {
      await deletePaymentMethod(paymentMethod.id);
      setPaymentMethods((previous) => previous.filter((pm) => pm.id !== paymentMethod.id));
      toast.success(SUCCESS_MESSAGES.deleted);
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
