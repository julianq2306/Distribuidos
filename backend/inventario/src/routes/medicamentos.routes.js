import express from 'express';
import {
  getAll,
  getById,
  create,
  update,
  remove,
  getStockBajo,
  getAlertas,
} from '../controllers/medicamentos.controller.js';

const router = express.Router();

router.get('/', getAll);
router.get('/alertas', getAlertas);
router.get('/stock-bajo', getStockBajo);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;