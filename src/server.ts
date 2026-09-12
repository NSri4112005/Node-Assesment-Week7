import http from "http";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

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

  res.writeHead(404);
  res.end(
    JSON.stringify({
      success: false,
      message: "Route not found",
    })
  );
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