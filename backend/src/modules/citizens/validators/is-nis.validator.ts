import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsNis(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNis',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          const nis = value.replace(/[^\d]+/g, '');
          if (nis.length !== 11) return false;
          if (/^(\d)\1{10}$/.test(nis)) return false;
          
          const multipliers = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
          let sum = 0;
          for (let i = 0; i < 10; i++) {
            sum += parseInt(nis.charAt(i)) * multipliers[i];
          }
          
          let remainder = sum % 11;
          let digit = 11 - remainder;
          if (digit === 10 || digit === 11) digit = 0;
          
          return digit === parseInt(nis.charAt(10));
        },
        defaultMessage(args: ValidationArguments) {
          return 'NIS inválido';
        }
      },
    });
  };
}
