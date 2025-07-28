const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'cristovive6234',
  database: process.env.DB_NAME || 'clinica',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Error en la consulta SQL:', error);
    throw error;
  }
}

async function initializeDatabase() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS pacientes (
        cod_paciente INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(50) NOT NULL,
        apellido VARCHAR(50) NOT NULL,
        direccion VARCHAR(100),
        poblacion ENUM('urbano', 'rural'),
        provincia VARCHAR(50),
        codigo_postal VARCHAR(10),
        telefono VARCHAR(15),
        fecha_nac DATE
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS medicos (
        cod_medico INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(50) NOT NULL,
        apellido VARCHAR(50) NOT NULL,
        telefono VARCHAR(15),
        especialidad VARCHAR(50)
      )
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS ingresos_paciente (
        cod_ingreso INT PRIMARY KEY AUTO_INCREMENT,
        cod_paciente INT NOT NULL,
        cod_medico INT NOT NULL,
        habitacion VARCHAR(10),
        cama VARCHAR(10),
        fecha_ingreso DATE NOT NULL,
        fecha_egreso DATE,
        FOREIGN KEY (cod_paciente) REFERENCES pacientes(cod_paciente),
        FOREIGN KEY (cod_medico) REFERENCES medicos(cod_medico)
      )
    `);
    
    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
}

initializeDatabase();

module.exports = {
  query,
  pool
};