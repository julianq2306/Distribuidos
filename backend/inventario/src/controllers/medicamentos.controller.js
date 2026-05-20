// Importa el modelo Medicamento definido con Sequelize (ORM)
import Medicamento from '../models/Medicamento.js';

/**
 * GET /medicamentos
 * Obtiene todos los medicamentos que están marcados como activos.
 * Responde con un array de medicamentos en formato JSON.
 */
export const getAll = async (req, res) => {
  try {
    // findAll con filtro: solo trae registros donde activo = true (soft delete)
    const medicamentos = await Medicamento.findAll({ where: { activo: true } });
    res.json(medicamentos);
  } catch (err) {
    // Error 500: problema en el servidor o en la base de datos
    res.status(500).json({ message: 'Error al obtener medicamentos', error: err.message });
  }
};

/**
 * GET /medicamentos/:id
 * Busca un medicamento específico por su clave primaria (PK).
 * Devuelve 404 si no existe.
 */
export const getById = async (req, res) => {
  try {
    // findByPk: búsqueda eficiente usando la clave primaria del modelo
    const medicamento = await Medicamento.findByPk(req.params.id);
    if (!medicamento) return res.status(404).json({ message: 'Medicamento no encontrado' });
    res.json(medicamento);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener medicamento', error: err.message });
  }
};

/**
 * POST /medicamentos
 * Crea un nuevo medicamento usando los datos enviados en el body.
 * Responde con código 201 (Created) si la inserción fue exitosa.
 */
export const create = async (req, res) => {
  try {
    // req.body debe contener los campos requeridos por el modelo Medicamento
    const medicamento = await Medicamento.create(req.body);
    res.status(201).json({ message: 'Medicamento creado', medicamento });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear medicamento', error: err.message });
  }
};

/**
 * PUT /medicamentos/:id
 * Actualiza un medicamento existente con los datos recibidos en el body.
 * Devuelve 404 si el medicamento no existe.
 */
export const update = async (req, res) => {
  try {
    // Primero se busca el registro para validar que exista
    const medicamento = await Medicamento.findByPk(req.params.id);
    if (!medicamento) return res.status(404).json({ message: 'Medicamento no encontrado' });

    // update() actualiza solamente los campos enviados en req.body
    await medicamento.update(req.body);
    res.json({ message: 'Medicamento actualizado', medicamento });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar medicamento', error: err.message });
  }
};

/**
 * DELETE /medicamentos/:id
 * Elimina físicamente un medicamento de la base de datos.
 * Nota: como existe el campo "activo", podría considerarse hacer
 * un soft delete (activo = false) en lugar de destroy().
 */
export const remove = async (req, res) => {
  try {
    const medicamento = await Medicamento.findByPk(req.params.id);
    if (!medicamento) return res.status(404).json({ message: 'Medicamento no encontrado' });

    // destroy() ejecuta un DELETE real en la tabla
    await medicamento.destroy();
    res.json({ message: 'Medicamento eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar medicamento', error: err.message });
  }
};

/**
 * GET /medicamentos/stock-bajo
 * Devuelve la lista de medicamentos activos cuyo stock actual
 * es menor o igual al stock mínimo configurado.
 */
export const getStockBajo = async (req, res) => {
  try {
    // Se obtienen todos los activos y se filtran en memoria.
    // Nota de eficiencia: este filtro podría hacerse directo en SQL
    // usando Op.lte para no traer registros innecesarios.
    const medicamentos = await Medicamento.findAll({ where: { activo: true } });
    const stockBajo = medicamentos.filter(m => m.stock_actual <= m.stock_minimo);
    res.json(stockBajo);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener stock bajo', error: err.message });
  }
};

/**
 * GET /medicamentos/alertas
 * Genera una lista de alertas por:
 *   - Medicamentos vencidos (prioridad 1)
 *   - Próximos a vencer en 30 días o menos (prioridad 2)
 *   - Stock por debajo o igual al mínimo (prioridad 3)
 * Las alertas se devuelven ordenadas por prioridad (las más críticas primero).
 */
export const getAlertas = async (req, res) => {
  try {
    // Traemos todos los medicamentos activos para analizarlos
    const medicamentos = await Medicamento.findAll({ where: { activo: true } });
    const hoy = new Date();
    const alertas = [];

    medicamentos.forEach((m) => {
      // Se convierte la fecha de vencimiento a objeto Date
      const vencimiento = new Date(m.fecha_vencimiento);

      // Cálculo de días restantes hasta el vencimiento.
      // (1000 * 60 * 60 * 24) = milisegundos en un día
      const dias = Math.floor((vencimiento - hoy) / (1000 * 60 * 60 * 24));

      if (dias < 0) {
        // Ya está vencido: máxima prioridad
        // Se usa m.dataValues para obtener los datos planos del modelo Sequelize
        alertas.push({ ...m.dataValues, tipo: 'vencido', dias, prioridad: 1 });
      } else if (dias <= 30) {
        // Está por vencer en el próximo mes
        alertas.push({ ...m.dataValues, tipo: 'proximo_vencer', dias, prioridad: 2 });
      }

      // Esta alerta es independiente de la fecha:
      // un medicamento puede aparecer dos veces si está vencido Y con stock bajo.
      if (m.stock_actual <= m.stock_minimo) {
        alertas.push({ ...m.dataValues, tipo: 'stock_bajo', prioridad: 3 });
      }
    });

    // Orden ascendente: prioridad 1 (vencidos) aparece antes que 2 y 3
    alertas.sort((a, b) => a.prioridad - b.prioridad);
    res.json(alertas);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener alertas', error: err.message });
  }
};