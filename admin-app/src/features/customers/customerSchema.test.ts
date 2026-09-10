import { customerSchema, normalizePhone } from './customerSchema';
test('rejects a customer without a valid name and phone',()=>{const result=customerSchema.safeParse({full_name:'A',phone:''});expect(result.success).toBe(false)});
test('normalizes phone numbers for duplicate detection',()=>{expect(normalizePhone('(11) 99999-0000')).toBe('11999990000')});
