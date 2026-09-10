import { z } from 'zod';
export const customerSchema = z.object({ full_name:z.string().trim().min(3,'Informe o nome completo.'), phone:z.string().trim().min(8,'Informe um telefone válido.'), whatsapp:z.string().trim().optional().default(''), email:z.string().email('Informe um e-mail válido.').optional().or(z.literal('')), cpf:z.string().trim().optional().default(''), address:z.string().trim().optional().default(''), notes:z.string().trim().optional().default('') });
export type CustomerInput=z.infer<typeof customerSchema>;
export const normalizePhone=(phone:string)=>phone.replace(/\D/g,'');
