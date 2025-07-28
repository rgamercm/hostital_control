const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { query } = require('./database');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas principales
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/pacientes', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'pacientes.html'));
});

app.get('/medicos', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'medicos.html'));
});

app.get('/ingresos', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'ingresos.html'));
});

// API Pacientes
app.get('/api/pacientes', async (req, res) => {
  try {
    const pacientes = await query('SELECT * FROM pacientes');
    res.json(pacientes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pacientes/:id', async (req, res) => {
  try {
    const paciente = await query('SELECT * FROM pacientes WHERE cod_paciente = ?', [req.params.id]);
    if (paciente.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json(paciente[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pacientes', async (req, res) => {
  try {
    const { nombre, apellido, direccion, poblacion, provincia, codigo_postal, telefono, fecha_nac } = req.body;
    const result = await query(
      'INSERT INTO pacientes (nombre, apellido, direccion, poblacion, provincia, codigo_postal, telefono, fecha_nac) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, apellido, direccion, poblacion, provincia, codigo_postal, telefono, fecha_nac]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, direccion, poblacion, provincia, codigo_postal, telefono, fecha_nac } = req.body;
    await query(
      'UPDATE pacientes SET nombre=?, apellido=?, direccion=?, poblacion=?, provincia=?, codigo_postal=?, telefono=?, fecha_nac=? WHERE cod_paciente=?',
      [nombre, apellido, direccion, poblacion, provincia, codigo_postal, telefono, fecha_nac, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/pacientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM pacientes WHERE cod_paciente = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Médicos
app.get('/api/medicos', async (req, res) => {
  try {
    const medicos = await query('SELECT * FROM medicos');
    res.json(medicos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/medicos/:id', async (req, res) => {
  try {
    const medico = await query('SELECT * FROM medicos WHERE cod_medico = ?', [req.params.id]);
    if (medico.length === 0) return res.status(404).json({ error: 'Médico no encontrado' });
    res.json(medico[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/medicos', async (req, res) => {
  try {
    const { nombre, apellido, telefono, especialidad } = req.body;
    const result = await query(
      'INSERT INTO medicos (nombre, apellido, telefono, especialidad) VALUES (?, ?, ?, ?)',
      [nombre, apellido, telefono, especialidad]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/medicos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, especialidad } = req.body;
    await query(
      'UPDATE medicos SET nombre=?, apellido=?, telefono=?, especialidad=? WHERE cod_medico=?',
      [nombre, apellido, telefono, especialidad, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/medicos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM medicos WHERE cod_medico = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Ingresos
app.get('/api/ingresos', async (req, res) => {
  try {
    const ingresos = await query(`
      SELECT i.*, 
             p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
             m.nombre AS medico_nombre, m.apellido AS medico_apellido
      FROM ingresos_paciente i
      JOIN pacientes p ON i.cod_paciente = p.cod_paciente
      JOIN medicos m ON i.cod_medico = m.cod_medico
      ORDER BY i.fecha_ingreso DESC
    `);
    res.json(ingresos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ingresos/:id', async (req, res) => {
  try {
    const ingreso = await query(`
      SELECT i.*, 
             p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
             m.nombre AS medico_nombre, m.apellido AS medico_apellido
      FROM ingresos_paciente i
      JOIN pacientes p ON i.cod_paciente = p.cod_paciente
      JOIN medicos m ON i.cod_medico = m.cod_medico
      WHERE i.cod_ingreso = ?
    `, [req.params.id]);
    
    if (ingreso.length === 0) return res.status(404).json({ error: 'Ingreso no encontrado' });
    res.json(ingreso[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ingresos', async (req, res) => {
  try {
    const { cod_paciente, cod_medico, habitacion, cama, fecha_ingreso } = req.body;
    const result = await query(
      'INSERT INTO ingresos_paciente (cod_paciente, cod_medico, habitacion, cama, fecha_ingreso) VALUES (?, ?, ?, ?, ?)',
      [cod_paciente, cod_medico, habitacion, cama, fecha_ingreso]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/ingresos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cod_paciente, cod_medico, habitacion, cama, fecha_ingreso } = req.body;
    await query(
      'UPDATE ingresos_paciente SET cod_paciente=?, cod_medico=?, habitacion=?, cama=?, fecha_ingreso=? WHERE cod_ingreso=?',
      [cod_paciente, cod_medico, habitacion, cama, fecha_ingreso, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/ingresos/:id/egreso', async (req, res) => {
  try {
    const { id } = req.params;
    const fechaActual = new Date().toISOString().split('T')[0];
    await query(
      'UPDATE ingresos_paciente SET fecha_egreso=? WHERE cod_ingreso=?',
      [fechaActual, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/ingresos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM ingresos_paciente WHERE cod_ingreso = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Contadores para el dashboard
app.get('/api/pacientes/count', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM pacientes');
    res.json({ count: result[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/medicos/count', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM medicos');
    res.json({ count: result[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ingresos/actuales/count', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM ingresos_paciente WHERE fecha_egreso IS NULL');
    res.json({ count: result[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});