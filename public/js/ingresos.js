// Función para mostrar notificaciones
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} alert-icon"></i>
        <div class="alert-message">${message}</div>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => {
            alertDiv.remove();
        }, 300);
    }, 3000);
}

// Formatear fecha para visualización
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Validación de campos
function setupInputValidation() {
    // Validación para habitación (letras y números)
    document.getElementById('habitacion')?.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^a-zA-Z0-9]/g, '');
    });
    
    // Validación para cama (letras y números)
    document.getElementById('cama')?.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^a-zA-Z0-9]/g, '');
    });
}

// Variables globales
let currentIngresoId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Verificar que estamos en la página de ingresos
    if (document.getElementById('ingresosTable')) {
        setupInputValidation();
        cargarIngresos();
        cargarSelectPacientes();
        cargarSelectMedicos();
        
        document.getElementById('ingresoForm').addEventListener('submit', guardarIngreso);
        document.getElementById('cancelEdit').addEventListener('click', cancelarEdicion);
        
        // Configurar modal de confirmación
        const confirmModal = document.getElementById('confirmModal');
        document.getElementById('confirmEgreso').addEventListener('click', confirmarEgreso);
        document.querySelector('.modal-close').addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });
        document.getElementById('cancelEgreso').addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });
    }
});

// Mostrar modal de confirmación para egreso
function mostrarConfirmacionEgreso(id) {
    currentIngresoId = id;
    document.getElementById('confirmModal').style.display = 'block';
}

// Confirmar el egreso
async function confirmarEgreso() {
    if (!currentIngresoId) return;
    
    const confirmModal = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('confirmEgreso');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<div class="loading-spinner"></div> Procesando...';

    try {
        const response = await fetch(`/api/ingresos/${currentIngresoId}/egreso`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error('Error al registrar el egreso');
        }
        
        confirmModal.style.display = 'none';
        showAlert('Egreso registrado correctamente');
        cargarIngresos();
    } catch (error) {
        console.error('Error registrando egreso:', error);
        showAlert('Error al registrar egreso: ' + error.message, 'error');
    } finally {
        currentIngresoId = null;
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
    }
}

async function cargarIngresos() {
    const tbody = document.querySelector('#ingresosTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="9" class="text-center"><div class="loading-spinner"></div> Cargando ingresos...</td></tr>';

    try {
        const response = await fetch('/api/ingresos');
        if (!response.ok) {
            throw new Error('Error al cargar ingresos');
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="no-data">No hay ingresos registrados</td></tr>';
            return;
        }
        
        mostrarIngresos(data);
    } catch (error) {
        console.error('Error cargando ingresos:', error);
        tbody.innerHTML = `<tr><td colspan="9" class="error">Error al cargar ingresos: ${error.message}</td></tr>`;
        showAlert('Error al cargar ingresos: ' + error.message, 'error');
    }
}

function mostrarIngresos(ingresos) {
    const tbody = document.querySelector('#ingresosTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    ingresos.forEach(ingreso => {
        const tr = document.createElement('tr');
        if (!ingreso.fecha_egreso) {
            tr.classList.add('ingreso-activo');
        }
        tr.innerHTML = `
            <td>${ingreso.cod_ingreso}</td>
            <td>${ingreso.paciente_nombre} ${ingreso.paciente_apellido}</td>
            <td>${ingreso.medico_nombre} ${ingreso.medico_apellido}</td>
            <td>${ingreso.habitacion}</td>
            <td>${ingreso.cama}</td>
            <td>${formatDate(ingreso.fecha_ingreso)}</td>
            <td>${ingreso.fecha_egreso ? formatDate(ingreso.fecha_egreso) : '-'}</td>
            <td>
                <span class="status-badge ${!ingreso.fecha_egreso ? 'badge-active' : 'badge-inactive'}">
                    ${!ingreso.fecha_egreso ? 'Activo' : 'Finalizado'}
                </span>
            </td>
            <td class="actions">
                <button class="btn btn-outline btn-sm" onclick="editarIngreso(${ingreso.cod_ingreso})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="eliminarIngreso(${ingreso.cod_ingreso})">
                    <i class="fas fa-trash-alt"></i> Eliminar
                </button>
                ${!ingreso.fecha_egreso ? `
                <button class="btn btn-success btn-sm" onclick="mostrarConfirmacionEgreso(${ingreso.cod_ingreso})">
                    <i class="fas fa-sign-out-alt"></i> Egreso
                </button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function cargarSelectPacientes() {
    const select = document.getElementById('cod_paciente');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccione un paciente</option>';
    
    try {
        const response = await fetch('/api/pacientes');
        if (!response.ok) {
            throw new Error('Error al cargar pacientes');
        }
        
        const data = await response.json();
        
        data.forEach(paciente => {
            const option = document.createElement('option');
            option.value = paciente.cod_paciente;
            option.textContent = `${paciente.nombre} ${paciente.apellido}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        showAlert('Error al cargar pacientes: ' + error.message, 'error');
    }
}

async function cargarSelectMedicos() {
    const select = document.getElementById('cod_medico');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccione un médico</option>';
    
    try {
        const response = await fetch('/api/medicos');
        if (!response.ok) {
            throw new Error('Error al cargar médicos');
        }
        
        const data = await response.json();
        
        data.forEach(medico => {
            const option = document.createElement('option');
            option.value = medico.cod_medico;
            option.textContent = `${medico.nombre} ${medico.apellido} (${medico.especialidad})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando médicos:', error);
        showAlert('Error al cargar médicos: ' + error.message, 'error');
    }
}

async function guardarIngreso(e) {
    e.preventDefault();
    
    const formData = {
        cod_paciente: document.getElementById('cod_paciente').value,
        cod_medico: document.getElementById('cod_medico').value,
        habitacion: document.getElementById('habitacion').value,
        cama: document.getElementById('cama').value,
        fecha_ingreso: document.getElementById('fecha_ingreso').value
    };

    if (!formData.cod_paciente || !formData.cod_medico || !formData.habitacion || !formData.cama || !formData.fecha_ingreso) {
        showAlert('Todos los campos son obligatorios', 'error');
        return;
    }

    const ingresoId = document.getElementById('ingresoId').value;
    const method = ingresoId ? 'PUT' : 'POST';
    const url = ingresoId ? `/api/ingresos/${ingresoId}` : '/api/ingresos';

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading-spinner"></div> Guardando...';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar ingreso');
        }
        
        await response.json();
        showAlert(ingresoId ? 'Ingreso actualizado correctamente' : 'Ingreso registrado correctamente');
        document.getElementById('ingresoForm').reset();
        cargarIngresos();
        cancelarEdicion();
    } catch (error) {
        console.error('Error guardando ingreso:', error);
        showAlert('Error al guardar ingreso: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function editarIngreso(id) {
    try {
        const response = await fetch(`/api/ingresos/${id}`);
        if (!response.ok) {
            throw new Error('Error al cargar ingreso');
        }
        
        const ingreso = await response.json();
        
        document.getElementById('ingresoId').value = ingreso.cod_ingreso;
        document.getElementById('cod_paciente').value = ingreso.cod_paciente;
        document.getElementById('cod_medico').value = ingreso.cod_medico;
        document.getElementById('habitacion').value = ingreso.habitacion;
        document.getElementById('cama').value = ingreso.cama;
        document.getElementById('fecha_ingreso').value = ingreso.fecha_ingreso.split('T')[0];
        
        document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Editando Ingreso';
        document.getElementById('cancelEdit').style.display = 'inline-block';
        
        showAlert(`Editando ingreso #${ingreso.cod_ingreso}`);
    } catch (error) {
        console.error('Error editando ingreso:', error);
        showAlert('Error al cargar ingreso: ' + error.message, 'error');
    }
}

async function eliminarIngreso(id) {
    if (!confirm('¿Está seguro de eliminar este ingreso? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/ingresos/${id}`, { method: 'DELETE' });
        
        if (!response.ok) {
            throw new Error('Error al eliminar ingreso');
        }
        
        showAlert('Ingreso eliminado correctamente');
        cargarIngresos();
    } catch (error) {
        console.error('Error eliminando ingreso:', error);
        showAlert('Error al eliminar ingreso: ' + error.message, 'error');
    }
}

function cancelarEdicion() {
    document.getElementById('ingresoForm').reset();
    document.getElementById('ingresoId').value = '';
    document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Registrar Nuevo Ingreso';
    document.getElementById('cancelEdit').style.display = 'none';
}