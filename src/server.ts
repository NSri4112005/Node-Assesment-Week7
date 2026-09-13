import http from "http";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import { router } from "./router";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Public health/root endpoint
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        success: true,
        message: "Inventory Management API is running",
      })
    );
    return;
  }

  try {
    const handled = await router(req, res);

    if (handled) {
      return;
    }

    res.writeHead(404);
    res.end(
      JSON.stringify({
        success: false,
        message: "Route not found",
      })
    );
  } catch (error) {
    console.error(error);

    if (!res.headersSent) {
      res.writeHead(500);
      res.end(
        JSON.stringify({
          success: false,
          message: "Internal server error",
        })
      );
    }
  }
});

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();