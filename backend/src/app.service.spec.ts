import { describe, expect, it } from 'vitest';
import { AppService } from './app.service';

describe('AppService', () => {
  it('deve retornar a mensagem de boas-vindas da API', () => {
    const service = new AppService();
    expect(service.getHello()).toBe('SIPPAT API - PAT Jacareí');
  });
});
