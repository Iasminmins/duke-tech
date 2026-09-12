import { cp, mkdir, rm } from 'node:fs/promises';

await rm('admin', { recursive: true, force: true });
await mkdir('admin', { recursive: true });
await cp('admin-app/dist', 'admin', { recursive: true });
