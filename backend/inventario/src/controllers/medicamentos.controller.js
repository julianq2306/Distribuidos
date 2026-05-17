import Medicamento from '../models/Medicamento.js';

export const getAll = async (req, res) => {
  try {
    const medicamentos = await Medicamento.findAll({ where: { activo: true } });
    res.json(medicamentos);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener medicamentos', error: err.message });
  }
};

export const getById = async (req, res) => {
  try {
    const medicamento = await Medicamento.findByPk(req.params.id);
    if (!medicamento) return res.status(404).json({ message: 'Medicamento no encontrado' });
    res.json(medicamento);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener medicamento', error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const medicamento = await Medicamento.create(req.body);
    res.status(201).json({ message: 'Medicamento creado', medicamento });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear medicamento', error: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const medicamento = await Medicamento.findByPk(req.params.id);
    if (!medicamento) return res.status(404).json({ message: 'Medicamento no encontrado' });
    await medicamento.update(req.body);
    res.json({ message: 'Medicamento actualizado', medicamento });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar medicamento', error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const medicamento = await Medicamento.findByPk(req.params.id);
    if (!medicamento) return res.status(404).json({ message: 'Medicamento no encontrado' });
    await medicamento.update({ activo: false });
    res.json({ message: 'Medicamento eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar medicamento', error: err.message });
  }
};

export const getStockBajo = async (req, res) => {
  try {
    const medicamentos = await Medicamento.findAll({ where: { activo: true } });
    const stockBajo = medicamentos.filter(m => m.stock_actual <= m.stock_minimo);
    res.json(stockBajo);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener stock bajo', error: err.message });
  }
};

export const getAlertas = async (req, res) => {
  try {
    const medicamentos = await Medicamento.findAll({ where: { activo: true } });
    const hoy = new Date();
    const alertas = [];

    medicamentos.forEach((m) => {
      const vencimiento = new Date(m.fecha_vencimiento);
      const dias = Math.floor((vencimiento - hoy) / (1000 * 60 * 60 * 24));

      if (dias < 0) {
        alertas.push({ ...m.dataValues, tipo: 'vencido', dias, prioridad: 1 });
      } else if (dias <= 30) {
        alertas.push({ ...m.dataValues, tipo: 'proximo_vencer', dias, prioridad: 2 });
      }

      if (m.stock_actual <= m.stock_minimo) {
        alertas.push({ ...m.dataValues, tipo: 'stock_bajo', prioridad: 3 });
      }
    });

    alertas.sort((a, b) => a.prioridad - b.prioridad);
    res.json(alertas);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener alertas', error: err.message });
  }
};