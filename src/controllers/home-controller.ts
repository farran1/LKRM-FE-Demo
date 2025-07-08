import { Request, Response } from 'express';

export class HomeController {
  async index(req: Request, res: Response) {
    return res.json({ message: 'ok' });
  }
} 