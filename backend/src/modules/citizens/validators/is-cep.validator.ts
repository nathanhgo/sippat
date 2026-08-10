import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsCep(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCep',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          const cleanCep = value.replace(/[^\d]+/g, '');
          return cleanCep.length === 8;
        },
        defaultMessage(args: ValidationArguments) {
          return 'CEP inválido';
        }
      },
    });
  };
}
