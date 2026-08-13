/* ============================================================
   Cliniware — app.js
   Lógica compartida: auth, sidebar, toasts, modals, API base
   ============================================================ */

// ── Configuración base ──────────────────────────────────────
const API_BASE = 'http://localhost:8080/api';

// ── Usuarios de prueba (hasta que el backend esté listo) ────
const USUARIOS_PRUEBA = [
  { username: 'admin',        password: 'admin123',  nombre: 'Administrador',    rol: 'ADMIN' },
  { username: 'recepcion',    password: 'rec123',    nombre: 'Ana Recepcionista', rol: 'RECEPCIONISTA' },
  { username: 'dr.perez',     password: 'med123',    nombre: 'Dr. Carlos Pérez', rol: 'MEDICO' },
];

// ── Sesión ──────────────────────────────────────────────────
const Auth = {
  login(username, password) {
    const user = USUARIOS_PRUEBA.find(
      u => u.username === username && u.password === password
    );
    if (user) {
      localStorage.setItem('cliniware_user', JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout() {
    localStorage.removeItem('cliniware_user');
    window.location.href = 'index.html';
  },

  getUser() {
    const data = localStorage.getItem('cliniware_user');
    return data ? JSON.parse(data) : null;
  },

  requireAuth() {
    const user = this.getUser();
    if (!user) {
      window.location.href = 'index.html';
      return null;
    }
    return user;
  },

  isLoggedIn() {
    return !!this.getUser();
  }
};

// ── Inicializar sidebar con datos del usuario ───────────────
function initSidebar(activeLink) {
  const user = Auth.requireAuth();
  if (!user) return;

  // Nombre y rol
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-user-avatar');
  const topbarUserEl = document.getElementById('topbar-user');

  if (nameEl) nameEl.textContent = user.nombre;
  if (roleEl) roleEl.textContent = user.rol;
  if (avatarEl) avatarEl.textContent = user.nombre.charAt(0).toUpperCase();
  if (topbarUserEl) topbarUserEl.textContent = user.nombre;

  // Marcar link activo
  if (activeLink) {
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.classList.remove('active');
    });
    const active = document.querySelector(`[data-page="${activeLink}"]`);
    if (active) active.classList.add('active');
  }

  // Ocultar admin si no es admin
  if (user.rol !== 'ADMIN') {
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = 'none';
    });
  }

  // Botón logout
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('¿Desea cerrar sesión?')) Auth.logout();
    });
  }

  // Topbar fecha
  const dateEl = document.getElementById('topbar-date');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('es-DO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}

// ── Toast notifications ──────────────────────────────────────
const Toast = {
  show(message, type = 'success', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: '<svg class="icon" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>',
      error:   '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
      warning: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>',
      info:    '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>',
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-msg">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg)   { this.show(msg, 'error'); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg)    { this.show(msg, 'info'); }
};

// ── Modal helpers ────────────────────────────────────────────
const Modal = {
  open(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.add('visible');
  },

  close(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.classList.remove('visible');
  },

  closeAll() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.classList.remove('visible');
    });
  },

  confirm(title, message, onConfirm) {
    const overlay = document.getElementById('modal-confirm');
    if (!overlay) return;
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    this.open('modal-confirm');
    const btn = document.getElementById('btn-confirm-ok');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
      this.close('modal-confirm');
      onConfirm();
    });
  }
};

// ── API helper ───────────────────────────────────────────────
const Api = {
  async get(endpoint) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`GET ${endpoint} failed, using mock data`);
      return null;
    }
  },

  async post(endpoint, data) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`POST ${endpoint} failed`);
      return null;
    }
  },

  async put(endpoint, data) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`PUT ${endpoint} failed`);
      return null;
    }
  },

  async delete(endpoint) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (err) {
      console.warn(`DELETE ${endpoint} failed`);
      return false;
    }
  }
};

// ── Datos mock (mientras no hay backend) ─────────────────────
const MockData = {
  pacientes: [
    { id: 1, numero_expediente: 'EXP-0001', nombre: 'María', apellido: 'González', cedula_pasaporte: '001-1234567-8', fecha_nacimiento: '1985-03-15', sexo: 'F', telefono: '809-555-0101', email: 'maria@email.com', archivado: false },
    { id: 2, numero_expediente: 'EXP-0002', nombre: 'Juan',  apellido: 'Pérez',    cedula_pasaporte: '001-7654321-4', fecha_nacimiento: '1990-07-22', sexo: 'M', telefono: '829-555-0202', email: 'juan@email.com',  archivado: false },
    { id: 3, numero_expediente: 'EXP-0003', nombre: 'Carmen', apellido: 'Rodríguez', cedula_pasaporte: '001-1122334-5', fecha_nacimiento: '1978-11-30', sexo: 'F', telefono: '849-555-0303', email: 'carmen@email.com', archivado: false },
    { id: 4, numero_expediente: 'EXP-0004', nombre: 'Roberto', apellido: 'Martínez', cedula_pasaporte: '001-9988776-2', fecha_nacimiento: '1965-05-10', sexo: 'M', telefono: '809-555-0404', email: 'roberto@email.com', archivado: false },
    { id: 5, numero_expediente: 'EXP-0005', nombre: 'Ana',  apellido: 'Díaz',     cedula_pasaporte: '001-3344556-7', fecha_nacimiento: '2000-01-05', sexo: 'F', telefono: '829-555-0505', email: 'ana@email.com', archivado: false },
  ],

  medicos: [
    { id: 1, nombre: 'Carlos', apellido: 'Pérez',    especialidad: 'Cardiología',  exequatur: 'EX-10234', telefono: '809-500-0001', activo: true },
    { id: 2, nombre: 'Laura',  apellido: 'Morales',  especialidad: 'Pediatría',    exequatur: 'EX-10235', telefono: '809-500-0002', activo: true },
    { id: 3, nombre: 'Miguel', apellido: 'Santana',  especialidad: 'Medicina General', exequatur: 'EX-10236', telefono: '809-500-0003', activo: true },
    { id: 4, nombre: 'Diana',  apellido: 'Feliz',    especialidad: 'Ginecología',  exequatur: 'EX-10237', telefono: '809-500-0004', activo: true },
  ],

  especialidades: [
    { id: 1, nombre: 'Cardiología' },
    { id: 2, nombre: 'Pediatría' },
    { id: 3, nombre: 'Medicina General' },
    { id: 4, nombre: 'Ginecología' },
    { id: 5, nombre: 'Dermatología' },
    { id: 6, nombre: 'Neurología' },
  ],

  servicios: [
    { id: 1, nombre: 'Consulta General',     precio_base: 1500, duracion_min: 30, activo: true },
    { id: 2, nombre: 'Electrocardiograma',   precio_base: 3500, duracion_min: 45, activo: true },
    { id: 3, nombre: 'Ultrasonido',          precio_base: 5000, duracion_min: 60, activo: true },
    { id: 4, nombre: 'Análisis de Sangre',   precio_base: 2500, duracion_min: 20, activo: true },
    { id: 5, nombre: 'Rayos X',              precio_base: 4000, duracion_min: 30, activo: true },
  ],

  citas: [
    { id: 1, numero_cita: 'CIT-0001', paciente: 'María González',  medico: 'Dr. Carlos Pérez',  servicio: 'Consulta General',   fecha_cita: '2025-08-05', hora_cita: '09:00', estado: 'COMPLETADA', monto: 1500 },
    { id: 2, numero_cita: 'CIT-0002', paciente: 'Juan Pérez',      medico: 'Dra. Laura Morales', servicio: 'Pediatría',          fecha_cita: '2025-08-05', hora_cita: '10:30', estado: 'CONFIRMADA', monto: 1500 },
    { id: 3, numero_cita: 'CIT-0003', paciente: 'Carmen Rodríguez', medico: 'Dr. Miguel Santana', servicio: 'Ultrasonido',       fecha_cita: '2025-08-06', hora_cita: '08:00', estado: 'PENDIENTE',  monto: 5000 },
    { id: 4, numero_cita: 'CIT-0004', paciente: 'Roberto Martínez', medico: 'Dra. Diana Feliz',  servicio: 'Electrocardiograma', fecha_cita: '2025-08-06', hora_cita: '11:00', estado: 'CANCELADA',  monto: 3500 },
    { id: 5, numero_cita: 'CIT-0005', paciente: 'Ana Díaz',        medico: 'Dr. Carlos Pérez',  servicio: 'Consulta General',   fecha_cita: '2025-08-07', hora_cita: '14:00', estado: 'PENDIENTE',  monto: 1500 },
  ],

  pagos: [
    { id: 1, numero_recibo: 'REC-0001', cita: 'CIT-0001', paciente: 'María González',  monto_total: 1500, metodo_pago: 'EFECTIVO',    estado: 'COMPLETO', fecha_pago: '2025-08-05' },
    { id: 2, numero_recibo: 'REC-0002', cita: 'CIT-0002', paciente: 'Juan Pérez',      monto_total: 1500, metodo_pago: 'TARJETA',     estado: 'COMPLETO', fecha_pago: '2025-08-05' },
    { id: 3, numero_recibo: 'REC-0003', cita: 'CIT-0003', paciente: 'Carmen Rodríguez', monto_total: 5000, metodo_pago: 'TRANSFERENCIA', estado: 'PARCIAL', fecha_pago: '2025-08-06' },
  ]
};

// ── Utilidades generales ─────────────────────────────────────
const Utils = {
  formatDate(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  },

  formatMoney(amount) {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency', currency: 'DOP', minimumFractionDigits: 2
    }).format(amount || 0);
  },

  formatDateTime(dateStr, timeStr) {
    return `${this.formatDate(dateStr)} ${timeStr || ''}`.trim();
  },

  calcAge(dob) {
    if (!dob) return '—';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  },

  getEstadoBadge(estado) {
    const map = {
      'PENDIENTE':   'badge badge-amber',
      'CONFIRMADA':  'badge badge-blue',
      'COMPLETADA':  'badge badge-green',
      'CANCELADA':   'badge badge-red',
      'COMPLETO':    'badge badge-green',
      'PARCIAL':     'badge badge-amber',
      'ANULADO':     'badge badge-red',
    };
    return map[estado] || 'badge badge-gray';
  },

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  generateId(prefix) {
    const num = String(Math.floor(Math.random() * 9000) + 1000);
    return `${prefix}-${num}`;
  }
};

// ── Close modals on overlay click ────────────────────────────
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    Modal.closeAll();
  }
});

// ── Close modals on Escape key ───────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') Modal.closeAll();
});
