export type Role = 'admin' | 'employee' | 'technician';
export const roleLabels: Record<Role, string> = { admin: 'Administrador', employee: 'Funcionário', technician: 'Técnico' };
export const permissionsByRole: Record<Role, string[]> = { admin: ['dashboard','comandas','clientes','aparelhos','agenda','produtos','estoque','vendas','financeiro','relatorios','usuarios','configuracoes'], employee: ['dashboard','comandas','clientes','aparelhos','agenda','produtos','estoque','vendas','relatorios'], technician: ['dashboard','comandas','clientes','aparelhos','agenda'] };
export const canManageUsers = (role: Role) => role === 'admin';
export function canDeactivateProfile(input: { actorRole: Role; targetRole: Role; activeAdmins: number }) { return input.actorRole === 'admin' && !(input.targetRole === 'admin' && input.activeAdmins <= 1); }
