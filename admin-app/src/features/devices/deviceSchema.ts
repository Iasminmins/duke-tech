import { z } from 'zod';
export const deviceSchema=z.object({customer_id:z.string().uuid('Selecione um cliente.'),brand:z.string().min(2,'Informe a marca.'),model:z.string().min(2,'Informe o modelo.'),reported_problem:z.string().min(5,'Descreva o problema informado.')});
export type DeviceInput=z.infer<typeof deviceSchema>;

