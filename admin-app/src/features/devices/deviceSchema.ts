import { z } from 'zod';
export const deviceSchema = z.object({
  customer_id: z.string().uuid('Selecione um cliente.'),
  brand: z.string().min(2, 'Informe a marca.'),
  model: z.string().min(2, 'Informe o modelo.'),
  color: z.string().trim().optional().default(''),
  imei: z.string().trim().optional().default(''),
  serial_number: z.string().trim().optional().default(''),
  access_password: z.string().trim().optional().default(''),
  physical_condition: z.string().trim().optional().default(''),
  received_accessories: z.string().trim().optional().default(''),
  reported_problem: z.string().min(5, 'Descreva o problema informado.'),
});
export type DeviceInput = z.infer<typeof deviceSchema>;
