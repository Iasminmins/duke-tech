import { deviceSchema } from './deviceSchema';
test('requires a customer, device identity, and reported problem',()=>{const result=deviceSchema.safeParse({customer_id:'not-a-uuid',brand:'',model:'',reported_problem:''});expect(result.success).toBe(false)});
