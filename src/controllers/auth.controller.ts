import { IncomingMessage, ServerResponse } from "http";
import { loginUser, registerUser } from "../services/auth.service";
import { LoginInput, RegisterInput } from "../types/auth.types";

const sendJson = (
  res: ServerResponse,
  statusCode: number,
  data: unknown
): void => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });

  res.end(JSON.stringify(data));
};

const parseBody = (req: IncomingMessage): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
};

export const registerController = async (
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> => {
  try {
    const body = (await parseBody(req)) as RegisterInput;

    if (!body.name || !body.email || !body.password) {
      sendJson(res, 400, {
        success: false,
        message: "Name, email and password are required",
      });
      return;
    }

    const result = await registerUser(body);

    sendJson(res, 201, {
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed";

    const statusCode =
      message === "Email already registered" ? 409 : 400;

    sendJson(res, statusCode, {
      success: false,
      message,
    });
  }
};

export const loginController = async (
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> => {
  try {
    const body = (await parseBody(req)) as LoginInput;

    if (!body.email || !body.password) {
      sendJson(res, 400, {
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const result = await loginUser(body);

    sendJson(res, 200, {
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Login failed";

    sendJson(res, 401, {
      success: false,
      message,
    });
  }
};

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { User } from "../models/user.model";
export const meController = async (
  req: AuthenticatedRequest,
  res: ServerResponse
): Promise<void> => {
  try {
    if (!req.user) {
      res.writeHead(401, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          success: false,
          message: "Unauthorized",
        })
      );

      return;
    }

    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      res.writeHead(404, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          success: false,
          message: "User not found",
        })
      );

      return;
    }

    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        success: true,
        message: "User profile fetched successfully",
        data: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      })
    );
  } catch {
    res.writeHead(500, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        success: false,
        message: "Failed to fetch user profile",
      })
    );
  }
};