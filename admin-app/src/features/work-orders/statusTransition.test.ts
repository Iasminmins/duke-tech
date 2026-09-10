import { statuses, workOrderSchema } from './workOrderSchema';
test('contains every public repair status in order',()=>{expect(statuses).toEqual(['received','diagnosis','quote_sent','awaiting_approval','approved','rejected','awaiting_part','repair','testing','ready','delivered','cancelled'])});
test('requires customer, device, and service request',()=>{expect(workOrderSchema.safeParse({customer_id:'',device_id:'',service_requested:''}).success).toBe(false)});
