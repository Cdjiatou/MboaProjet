import { Request, Response } from 'express';
import * as adminUsersService from '../services/adminUsers.service';
import { catchAsync } from '../utils/catchAsync';

export const listAdmins = catchAsync(async (req: Request, res: Response) => {
  const users = await adminUsersService.getAdminUsers();
  res.json({ success: true, data: users });
});

export const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const user = await adminUsersService.createAdminUser(req.body);
  res.status(201).json({ success: true, data: user });
});

export const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const user = await adminUsersService.updateAdminUser(id, req.body);
  res.json({ success: true, data: user });
});

export const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  await adminUsersService.deleteAdminUser(id);
  res.json({ success: true, message: 'Administrateur supprimé avec succès' });
});
