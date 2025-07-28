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

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('medicoForm')) {
        cargarMedicos();
        document.getElementById('medicoForm').addEventListener('submit', guardarMedico);
        document.getElementById('cancelEdit').addEventListener('click', cancelarEdicion);
    }
});

async function cargarMedicos() {
    const tbody = document.querySelector('#medicosTable tbody');
    if (!tbody) return;
    
    try {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="loading-spinner"></div> Cargando médicos...</td></tr>';
        
        const response = await fetch('/api/medicos');
        if (!response.ok) throw new Error('Error al cargar médicos');
        
        const medicos = await response.json();
        
        if (medicos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No hay médicos registrados</td></tr>';
            return;
        }
        
        mostrarMedicos(medicos);
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="error">${error.message}</td></tr>`;
        showAlert('Error al cargar médicos: ' + error.message, 'error');
    }
}

function mostrarMedicos(medicos) {
    const tbody = document.querySelector('#medicosTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    medicos.forEach(medico => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${medico.cod_medico}</td>
            <td>${medico.nombre}</td>
            <td>${medico.apellido}</td>
            <td>${medico.telefono || '-'}</td>
            <td>${medico.especialidad || '-'}</td>
            <td class="actions">
                <button class="btn btn-outline btn-sm" onclick="editarMedico(${medico.cod_medico})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="eliminarMedico(${medico.cod_medico})">
                    <i class="fas fa-trash-alt"></i> Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function guardarMedico(e) {
    e.preventDefault();
    
    const formData = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        telefono: document.getElementById('telefono').value,
        especialidad: document.getElementById('especialidad').value
    };

    if (!formData.nombre || !formData.apellido || !formData.especialidad) {
        showAlert('Nombre, apellido y especialidad son obligatorios', 'error');
        return;
    }

    const medicoId = document.getElementById('medicoId').value;
    const method = medicoId ? 'PUT' : 'POST';
    const url = medicoId ? `/api/medicos/${medicoId}` : '/api/medicos';

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
        
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        
        showAlert(medicoId ? 'Médico actualizado con éxito' : 'Médico registrado con éxito');
        document.getElementById('medicoForm').reset();
        await cargarMedicos();
        cancelarEdicion();
    } catch (error) {
        console.error('Error al guardar médico:', error);
        showAlert('Error al guardar médico: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function editarMedico(id) {
    try {
        const response = await fetch(`/api/medicos/${id}`);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        
        const medico = await response.json();
        
        document.getElementById('medicoId').value = medico.cod_medico;
        document.getElementById('nombre').value = medico.nombre;
        document.getElementById('apellido').value = medico.apellido;
        document.getElementById('telefono').value = medico.telefono || '';
        document.getElementById('especialidad').value = medico.especialidad || '';
        
        document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Editando Médico';
        document.getElementById('cancelEdit').style.display = 'inline-block';
        
        showAlert(`Editando médico: ${medico.nombre} ${medico.apellido}`);
    } catch (error) {
        console.error('Error al cargar médico:', error);
        showAlert('Error al cargar médico: ' + error.message, 'error');
    }
}

async function eliminarMedico(id) {
    if (!confirm('¿Está seguro de eliminar este médico? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/medicos/${id}`, { method: 'DELETE' });
        
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        
        showAlert('Médico eliminado con éxito');
        await cargarMedicos();
    } catch (error) {
        console.error('Error al eliminar médico:', error);
        showAlert('Error al eliminar médico: ' + error.message, 'error');
    }
}

function cancelarEdicion() {
    document.getElementById('medicoForm').reset();
    document.getElementById('medicoId').value = '';
    document.getElementById('form-title').innerHTML = '<i class="fas fa-plus-circle"></i> Registrar Nuevo Médico';
    document.getElementById('cancelEdit').style.display = 'none';
}