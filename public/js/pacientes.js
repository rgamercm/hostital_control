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
    // Solo letras y espacios para nombres y apellidos
    document.getElementById('nombre')?.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    });
    
    document.getElementById('apellido')?.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    });
    
    // Letras, números y caracteres comunes para direcciones
    document.getElementById('direccion')?.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.,#\-]/g, '');
    });
    
    // Solo letras para provincia
    document.getElementById('provincia')?.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    });
    
    // Solo números para código postal
    document.getElementById('codigo_postal')?.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
    
    // Validación de teléfono (números, espacios, guiones y paréntesis)
    document.getElementById('telefono')?.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9\s\-\(\)]/g, '');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('pacienteForm')) {
        setupInputValidation();
        cargarPacientes();
        document.getElementById('pacienteForm').addEventListener('submit', guardarPaciente);
        document.getElementById('cancelEdit')?.addEventListener('click', cancelarEdicion);
    }
});

async function cargarPacientes() {
    const tbody = document.querySelector('#pacientesTable tbody');
    if (!tbody) return;
    
    try {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center"><div class="loading-spinner"></div> Cargando pacientes...</td></tr>';
        
        const response = await fetch('/api/pacientes');
        if (!response.ok) throw new Error('Error al cargar pacientes');
        
        const pacientes = await response.json();
        
        if (pacientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="no-data">No hay pacientes registrados</td></tr>';
            return;
        }
        
        mostrarPacientes(pacientes);
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = `<tr><td colspan="9" class="error">${error.message}</td></tr>`;
        showAlert('Error al cargar pacientes: ' + error.message, 'error');
    }
}

function mostrarPacientes(pacientes) {
    const tbody = document.querySelector('#pacientesTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    pacientes.forEach(paciente => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${paciente.cod_paciente}</td>
            <td>${paciente.nombre}</td>
            <td>${paciente.apellido}</td>
            <td>${paciente.direccion || '-'}</td>
            <td><span class="status-badge ${paciente.poblacion === 'urbano' ? 'badge-active' : 'badge-inactive'}">
                ${paciente.poblacion === 'urbano' ? 'Urbano' : 'Rural'}
            </span></td>
            <td>${paciente.provincia || '-'}</td>
            <td>${paciente.telefono || '-'}</td>
            <td>${formatDate(paciente.fecha_nac)}</td>
            <td class="actions">
                <button class="btn btn-outline btn-sm" onclick="editarPaciente(${paciente.cod_paciente})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="eliminarPaciente(${paciente.cod_paciente})">
                    <i class="fas fa-trash-alt"></i> Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function guardarPaciente(e) {
    e.preventDefault();
    
    const formData = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        direccion: document.getElementById('direccion').value,
        poblacion: document.getElementById('poblacion').value,
        provincia: document.getElementById('provincia').value,
        codigo_postal: document.getElementById('codigo_postal').value,
        telefono: document.getElementById('telefono').value,
        fecha_nac: document.getElementById('fecha_nac').value
    };

    if (!formData.nombre || !formData.apellido) {
        showAlert('Nombre y apellido son obligatorios', 'error');
        return;
    }

    const pacienteId = document.getElementById('pacienteId')?.value;
    const method = pacienteId ? 'PUT' : 'POST';
    const url = pacienteId ? `/api/pacientes/${pacienteId}` : '/api/pacientes';

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading-spinner"></div> Guardando...';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al guardar paciente');
        }

        showAlert(pacienteId ? 'Paciente actualizado con éxito' : 'Paciente registrado con éxito');
        document.getElementById('pacienteForm').reset();
        await cargarPacientes();
        cancelarEdicion();
    } catch (error) {
        console.error('Error al guardar paciente:', error);
        showAlert(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function editarPaciente(id) {
    try {
        const response = await fetch(`/api/pacientes/${id}`);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        
        const paciente = await response.json();
        
        // Crear campo oculto si no existe
        if (!document.getElementById('pacienteId')) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.id = 'pacienteId';
            document.getElementById('pacienteForm').appendChild(input);
        }
        
        document.getElementById('pacienteId').value = paciente.cod_paciente;
        document.getElementById('nombre').value = paciente.nombre;
        document.getElementById('apellido').value = paciente.apellido;
        document.getElementById('direccion').value = paciente.direccion || '';
        document.getElementById('poblacion').value = paciente.poblacion || 'urbano';
        document.getElementById('provincia').value = paciente.provincia || '';
        document.getElementById('codigo_postal').value = paciente.codigo_postal || '';
        document.getElementById('telefono').value = paciente.telefono || '';
        document.getElementById('fecha_nac').value = paciente.fecha_nac ? paciente.fecha_nac.split('T')[0] : '';
        
        document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Editando Paciente';
        
        // Crear botón cancelar si no existe
        if (!document.getElementById('cancelEdit')) {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = 'cancelEdit';
            cancelBtn.className = 'btn btn-outline';
            cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar';
            cancelBtn.onclick = cancelarEdicion;
            document.querySelector('#pacienteForm .form-group').appendChild(cancelBtn);
        } else {
            document.getElementById('cancelEdit').style.display = 'inline-block';
        }
        
        showAlert(`Editando paciente: ${paciente.nombre} ${paciente.apellido}`);
    } catch (error) {
        console.error('Error al cargar paciente:', error);
        showAlert('Error al cargar paciente: ' + error.message, 'error');
    }
}

async function eliminarPaciente(id) {
    if (!confirm('¿Está seguro de eliminar este paciente? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/pacientes/${id}`, { method: 'DELETE' });
        
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        
        showAlert('Paciente eliminado con éxito');
        await cargarPacientes();
    } catch (error) {
        console.error('Error al eliminar paciente:', error);
        showAlert('Error al eliminar paciente: ' + error.message, 'error');
    }
}

function cancelarEdicion() {
    document.getElementById('pacienteForm').reset();
    document.getElementById('pacienteId')?.remove();
    document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Registrar Nuevo Paciente';
    document.getElementById('cancelEdit')?.remove();
}