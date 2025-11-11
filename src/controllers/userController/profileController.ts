import type { Request, Response } from "express";
import prisma from "../../lib/prisma.js";

export const getProfiles = async (_req: Request, res: Response) => {
  const profiles = await prisma.profile.findMany();
  res.json(profiles);
};

export const createProfile = async (req: Request, res: Response) => {
  try {
    const profile = await prisma.profile.create({
      data: req.body,
    });
    res.status(201).json(profile);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};