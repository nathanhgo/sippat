import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  static cpf(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;
      if (!val) return null;
      const cpf = val.replace(/[^\d]+/g, '');
      if (cpf.length !== 11) return { invalidCpf: true };
      if (/^(\d)\1{10}$/.test(cpf)) return { invalidCpf: true };

      let sum = 0;
      let remainder;

      for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
      }
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cpf.substring(9, 10))) return { invalidCpf: true };

      sum = 0;
      for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
      }
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cpf.substring(10, 11))) return { invalidCpf: true };

      return null;
    };
  }

  static nis(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;
      if (!val) return null;
      const nis = val.replace(/[^\d]+/g, '');
      if (nis.length !== 11) return { invalidNis: true };
      if (/^(\d)\1{10}$/.test(nis)) return { invalidNis: true };

      const multipliers = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      let sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(nis.charAt(i)) * multipliers[i];
      }

      let remainder = sum % 11;
      let digit = 11 - remainder;
      if (digit === 10 || digit === 11) digit = 0;

      return digit === parseInt(nis.charAt(10)) ? null : { invalidNis: true };
    };
  }

  static cep(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;
      if (!val) return null;
      const cleanCep = val.replace(/[^\d]+/g, '');
      return cleanCep.length === 8 ? null : { invalidCep: true };
    };
  }
}
