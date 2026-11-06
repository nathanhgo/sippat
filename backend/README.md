# Backend do SIPPAT

API em NestJS + Prisma. A documentação do projeto está na raiz:

- [readme.md](../readme.md): como subir o projeto
- [devs.md](../devs.md): arquitetura, API, banco, testes e problemas conhecidos
- [guia.md](../guia.md): guia de uso para quem opera o sistema

## Comandos rápidos

```bash
npm install
npx prisma migrate deploy   # aplica as migrations no banco de desenvolvimento
npx prisma db seed          # popula usuários e cidadãos de exemplo
npm run start:dev           # API em http://localhost:3000/api
```

Swagger: `http://localhost:3000/docs`.

```bash
npm test                    # unitários
npm run prisma:migrate:test # prepara o banco de testes
npm run test:e2e            # E2E da API
```
