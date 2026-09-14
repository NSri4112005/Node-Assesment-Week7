import { IncomingMessage, ServerResponse } from "http";
import { createInventoryCsvStream } from "../utils/csv";
import { getInventoryReport } from "../services/report.service";

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

export const getInventoryReportController = async (
  _req: IncomingMessage,
  res: ServerResponse
): Promise<void> => {
  try {
    const report = await getInventoryReport();

    sendJson(res, 200, {
      success: true,
      message: "Inventory report generated successfully",
      data: report,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate inventory report";

    sendJson(res, 500, {
      success: false,
      message,
    });
  }
};

export const exportInventoryCsvController = (
  _req: IncomingMessage,
  res: ServerResponse
): void => {
  try {
    const csvStream = createInventoryCsvStream();

    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="inventory-report.csv"',
    });

    csvStream.on("error", () => {
      if (!res.headersSent) {
        sendJson(res, 500, {
          success: false,
          message: "Failed to export inventory CSV",
        });
      } else {
        res.destroy();
      }
    });

    csvStream.pipe(res);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to export inventory CSV";

    sendJson(res, 500, {
      success: false,
      message,
    });
  }
};