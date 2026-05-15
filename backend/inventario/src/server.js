import express from "express";
import cors from "cors";
import { syncDatabase } from "./models/index.js";
import medicamentosRoutes from "./routes/medicamentos.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servicio de inventario funcionando 🚀");
});

app.use("/medicamentos", medicamentosRoutes);

const PORT = process.env.PORT || 3001;

syncDatabase().then(() => {
  app.listen(PORT, () => console.log(`🚀 Inventario en puerto ${PORT}`));
}).catch((err) => {
  console.error("❌ No se pudo iniciar inventario:", err);
  process.exit(1);
});