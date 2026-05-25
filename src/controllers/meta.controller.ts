import type { Request, Response } from "express";

import { listRoles } from "../services/role.service.js";

export const getRoles = async (_req: Request, res: Response) => {
  const roles = await listRoles();

  res.json({
    success: true,
    data: {
      roles,
    },
  });
};
