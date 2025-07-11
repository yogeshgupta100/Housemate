import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { errorHandler } from "./utils/error.js";
import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import newsRoutes from "./routes/newsRoute.js";
import userRoutes from "./routes/userRoutes.js";
import appointmentRoutes from "./routes/appointmentRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import favoritesRoutes from "./routes/favoritesRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import pool from "./config/postgres.js";
import otpRoutes from "./routes/otpRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import sceneRoutes from "./routes/sceneRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";

dotenv.config();

console.log("Starting server initialization...");

pool
  .connect()
  .then(() => console.log("✅ PostgreSQL Connected"))
  .catch((err) => {
    console.error("❌ PostgreSQL Connection Error:", err.message);
    process.exit(1);
  });

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Debug middleware
app.use((req, res, next) => {
  console.log("Incoming request:", {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    params: req.params,
    body: req.body,
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Allow-Origin",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Debug route to test if server is working
app.get("/test", (req, res) => {
  console.log("Test route hit");
  res.json({ message: "Server is working!" });
});

// Log all registered routes
const routes = [
  { path: "/api/auth", router: authRoutes },
  { path: "/api/users", router: userRoutes },
  { path: "/api/properties", router: propertyRoutes },
  { path: "/api/news", router: newsRoutes },
  { path: "/api/appointments", router: appointmentRoutes },
  { path: "/api/admin", router: adminRoutes },
  { path: "/api/favorites", router: favoritesRoutes },
  { path: "/api/pg", router: pdfRoutes },
  { path: "/api/otp", router: otpRoutes },
  { path: "/api/upload", router: uploadRoutes },
  { path: "/api/scenes", router: sceneRoutes },
  { path: "/api/payments", router: paymentRoutes },
  { path: "/api/transactions", router: transactionRoutes },
];

routes.forEach((route) => {
  console.log(`Registering route: ${route.path}`);
  app.use(route.path, route.router);
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Test the server at: http://localhost:${PORT}/test`);
  console.log("Registered routes:");
  routes.forEach((route) => console.log(`- ${route.path}`));
});
