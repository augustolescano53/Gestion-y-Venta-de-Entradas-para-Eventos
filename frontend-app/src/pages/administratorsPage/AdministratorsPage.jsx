import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../../api/admins.js';
import { localToday } from '../../constants/statuses.js';
import { useConfirm } from '../../components/confirmDialog/useConfirm.js';
import { getCurrentUser } from '../../shared/currentUser.js';
import { EMPTY_USER_FORM } from '../../shared/user.data.js';
import {
  buildUserPayload,
  userDeleteConfirmMessage,
  userToFormData,
  validateUserForm,
} from '../../shared/user.helpers.js';
import { DELETE_CONFIRM, SUCCESS_MESSAGES } from './AdministratorsPage.consts.js';

// Misma CRUD que Organizadores. El backend no deja eliminar la propia cuenta
// ni al último administrador (responde 409 con el motivo).
function AdministratorsPage() {
  const confirm = useConfirm();
  const currentId = getCurrentUser()?.id;

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState(EMPTY_USER_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadAdmins() {
    setLoading(true);
    setListError(null);
    try {
      setAdmins(await getAdmins());
    } catch (error) {
      setListError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  function openCreateForm() {
    setEditingAdmin(null);
    setFormData(EMPTY_USER_FORM);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(admin) {
    setEditingAdmin(admin);
    setFormData(userToFormData(admin));
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingAdmin(null);
    setFormError(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateUserForm(formData, { editing: Boolean(editingAdmin) });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = buildUserPayload(formData);

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingAdmin) {
        await updateAdmin(editingAdmin.id, payload);
        toast.success(SUCCESS_MESSAGES.updated);
      } else {
        await createAdmin(payload);
        toast.success(SUCCESS_MESSAGES.created);
      }
      closeForm();
      await loadAdmins();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(admin) {
    const confirmed = await confirm({
      ...DELETE_CONFIRM,
      message: userDeleteConfirmMessage(admin),
    });
    if (!confirmed) return;

    setDeletingId(admin.id);
    setListError(null);
    try {
      await deleteAdmin(admin.id);
      setAdmins((previous) => previous.filter((a) => a.id !== admin.id));
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
        <h2>Administradores</h2>
        <button type="button" className="btn btn--primary" onClick={openCreateForm}>
          + Nuevo administrador
        </button>
      </div>

      {listError && (
        <p className="banner banner--error">
          {listError}{' '}
          <button type="button" className="btn" onClick={loadAdmins}>
            Reintentar
          </button>
        </p>
      )}

      {isFormOpen && (
        <form className="form-card" onSubmit={handleSubmit}>
          <h3>{editingAdmin ? 'Editar administrador' : 'Nuevo administrador'}</h3>

          {formError && <p className="banner banner--error">{formError}</p>}

          <div className="form-grid">
            <label className="field">
              <span>Nombre</span>
              <input name="firstName" value={formData.firstName} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Apellido</span>
              <input name="lastName" value={formData.lastName} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Email</span>
              <input name="email" type="email" value={formData.email} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Documento</span>
              <input name="identityDocument" value={formData.identityDocument} onChange={handleChange} />
            </label>

            <label className="field">
              <span>Fecha de nacimiento</span>
              <input
                name="birthDate"
                type="date"
                max={localToday()}
                value={formData.birthDate}
                onChange={handleChange}
              />
            </label>

            <label className="field field--wide">
              <span>Contraseña</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder={editingAdmin ? 'Dejar en blanco para no cambiarla' : ''}
                value={formData.password}
                onChange={handleChange}
              />
            </label>
          </div>

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
        <p>Cargando administradores...</p>
      ) : admins.length === 0 ? (
        <p>Todavía no hay administradores cargados.</p>
      ) : (
        <ul className="card-list">
          {admins.map((admin) => (
            <li key={admin.id} className="card">
              <h3>
                {admin.firstName} {admin.lastName}
                {admin.id === currentId && <span className="tag">Vos</span>}
              </h3>
              <p>{admin.email}</p>
              <p>Documento: {admin.identityDocument}</p>
              {admin.birthDate && <p>Fecha de nacimiento: {admin.birthDate}</p>}
              <div className="card__actions">
                <button type="button" onClick={() => openEditForm(admin)}>
                  Editar
                </button>
                {admin.id !== currentId && (
                  <button
                    type="button"
                    className="btn--danger"
                    onClick={() => handleDelete(admin)}
                    disabled={deletingId === admin.id}
                  >
                    {deletingId === admin.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default AdministratorsPage;
