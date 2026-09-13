import { z } from 'zod';
import type { BadgeTone } from '../../components/ui/Badge';
export const statuses=['received','diagnosis','quote_sent','awaiting_approval','approved','rejected','awaiting_part','repair','testing','ready','delivered','cancelled'] as const;
export type WorkOrderStatus=typeof statuses[number];
export const statusLabels:Record<WorkOrderStatus,string>={received:'Recebido',diagnosis:'Em diagnóstico',quote_sent:'Orçamento enviado',awaiting_approval:'Aguardando aprovação',approved:'Aprovado',rejected:'Rejeitado',awaiting_part:'Aguardando peça',repair:'Em reparo',testing:'Em teste',ready:'Pronto para retirada',delivered:'Entregue',cancelled:'Cancelado'};
// Fonte unica de verdade para o tom semantico do badge de status (usado em WorkOrdersPage e WorkOrderDetailPage).
export const statusTone:Record<WorkOrderStatus,BadgeTone>={received:'info',diagnosis:'info',quote_sent:'warning',awaiting_approval:'warning',approved:'info',rejected:'danger',awaiting_part:'warning',repair:'info',testing:'info',ready:'success',delivered:'success',cancelled:'danger'};
export type WorkOrderPriority='normal'|'high'|'urgent';
export const priorityTone:Record<WorkOrderPriority,BadgeTone>={normal:'neutral',high:'warning',urgent:'urgent'};
export const statusFilters:{label:string;statuses:WorkOrderStatus[]}[]=[{label:'Todos',statuses:[...statuses]},{label:'Em diagnóstico',statuses:['diagnosis']},{label:'Em reparo',statuses:['repair','awaiting_part','testing']},{label:'Prontos',statuses:['ready']}];
export const workOrderSchema=z.object({customer_id:z.string().uuid('Selecione um cliente.'),device_id:z.string().uuid('Selecione um aparelho.'),service_requested:z.string().min(5,'Descreva o serviço solicitado.'),priority:z.enum(['normal','high','urgent']).default('normal'),estimated_due_date:z.string().optional().default(''),internal_notes:z.string().optional().default('')});
export type WorkOrderInput=z.infer<typeof workOrderSchema>;
