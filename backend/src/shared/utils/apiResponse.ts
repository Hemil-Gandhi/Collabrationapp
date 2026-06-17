import { Response } from "express";

export const ApiResponse = {
  success<T>(res: Response, data: T, statusCode = 200) {
    return res.status(statusCode).json({ success: true, data });
  },

  created<T>(res: Response, data: T) {
    return this.success(res, data, 201);
  },

  noContent(res: Response) {
    return res.status(204).send();
  },

  error(res: Response, message: string, statusCode = 500) {
    return res.status(statusCode).json({ success: false, error: message });
  },
};
