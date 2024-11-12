import { z } from 'zod';

export const ModSchema = z.object({
  title: z.string(),
  imageUrl: z.string().url(),
  modUrl: z.string().url(),
  type: z.enum(['mod', 'map', 'gamemode']),
  modioVersion: z
    .number()
    .refine((val) => val.toString().length === 7)
    .optional(),
  localVersion: z
    .number()
    .refine((val) => val.toString().length === 7)
    .optional(),
  subscribed: z.boolean(),
  corrupted: z.boolean(),
  infected: z.boolean(),
});
