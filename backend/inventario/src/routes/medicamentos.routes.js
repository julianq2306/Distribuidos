// Framework Express para definir rutas HTTP
import express from 'express';

// Importa las funciones controladoras que manejan la lógica de cada endpoint.
// Estas funciones fueron definidas en el archivo medicamentos.controller.js
import {
  getAll,        // GET    /          → lista todos los medicamentos activos
  getById,       // GET    /:id       → obtiene un medicamento por ID
  create,        // POST   /          → crea un nuevo medicamento
  update,        // PUT    /:id       → actualiza un medicamento existente
  remove,        // DELETE /:id       → elimina un medicamento
  getStockBajo,  // GET    /stock-bajo → lista medicamentos con stock bajo
  getAlertas,    // GET    /alertas    → lista alertas (vencidos, por vencer, stock bajo)
} from '../controllers/medicamentos.controller.js';

// Crea una instancia de Router de Express.
// El router agrupa las rutas relacionadas con medicamentos y se monta luego
// en la app principal con algo como: app.use('/api/medicamentos', router)
const router = express.Router();

/**
 * Definición de rutas del módulo de medicamentos.
 *
 * IMPORTANTE - Orden de las rutas:
 * Las rutas estáticas ('/alertas', '/stock-bajo') deben declararse ANTES
 * que las rutas con parámetros dinámicos ('/:id').
 *
 * Si '/:id' se declarara primero, Express interpretaría "alertas" y "stock-bajo"
 * como un valor del parámetro :id y nunca llegarían a sus controladores correctos.
 */

// Listar todos los medicamentos activos
router.get('/', getAll);

// Obtener todas las alertas del sistema (vencidos, próximos a vencer, stock bajo)
router.get('/alertas', getAlertas);

// Obtener medicamentos cuyo stock actual está por debajo o igual al mínimo
router.get('/stock-bajo', getStockBajo);

// Obtener un medicamento específico por su ID (ruta dinámica, va al final de los GET)
router.get('/:id', getById);

// Crear un nuevo medicamento (los datos vienen en req.body)
router.post('/', create);

// Actualizar un medicamento existente identificado por su ID
router.put('/:id', update);

// Eliminar un medicamento por su ID
router.delete('/:id', remove);

// Exporta el router para montarlo en la aplicación principal
export default router;