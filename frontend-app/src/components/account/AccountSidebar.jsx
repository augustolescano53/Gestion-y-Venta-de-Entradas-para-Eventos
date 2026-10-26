import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronIcon, LogoutIcon } from '../layout/icons.jsx';
import './AccountSidebar.css';

function linkClass({ isActive }) {
  return `account-nav__link ${isActive ? 'account-nav__link--active' : ''}`;
}

function ItemContent({ icon: Icon, label, chevron = true }) {
  return (
    <>
      {Icon && <Icon className="account-nav__icon" />}
      <span className="account-nav__label">{label}</span>
      {chevron && <ChevronIcon className="account-nav__chevron" />}
    </>
  );
}

// Grupo desplegable (Panel de administración). Arranca abierto si la página
// actual es una de sus opciones.
function NavGroup({ group }) {
  const { pathname } = useLocation();
  const containsCurrent = group.children.some((child) => pathname.startsWith(child.to));
  const [open, setOpen] = useState(containsCurrent);
  const listId = `account-nav-${group.id}`;

  return (
    <li>
      <button
        type="button"
        className={`account-nav__link account-nav__toggle ${containsCurrent ? 'account-nav__toggle--current' : ''}`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <ItemContent icon={group.icon} label={group.label} chevron={false} />
        <ChevronIcon className={`account-nav__caret ${open ? 'account-nav__caret--open' : ''}`} />
      </button>
      {open && (
        <ul id={listId} className="account-nav__sublist">
          {group.children.map((child) => (
            <li key={child.to}>
              <NavLink to={child.to} className={linkClass}>
                <ItemContent label={child.label} />
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// Menú lateral de Mi cuenta y del panel de administración. items: opciones
// { to, label, icon } o grupos { id, label, icon, children: [{ to, label }] }.
// En escritorio ocupa el alto de la pantalla con "Cerrar sesión" abajo; en
// celular es una lista de filas táctiles con ícono y flecha.
function AccountSidebar({ label, items, onLogout }) {
  return (
    <nav aria-label={label} className="account-nav">
      <ul className="account-nav__list">
        {items.map((item) =>
          item.children ? (
            <NavGroup key={item.id} group={item} />
          ) : (
            <li key={item.to}>
              <NavLink to={item.to} className={linkClass}>
                <ItemContent icon={item.icon} label={item.label} />
              </NavLink>
            </li>
          ),
        )}
        {/* Cerrar sesión es una acción distinta: va separada por una línea. */}
        <li className="account-nav__logout-item">
          <button type="button" onClick={onLogout} className="account-nav__link account-nav__logout">
            <ItemContent icon={LogoutIcon} label="Cerrar sesión" chevron={false} />
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default AccountSidebar;
