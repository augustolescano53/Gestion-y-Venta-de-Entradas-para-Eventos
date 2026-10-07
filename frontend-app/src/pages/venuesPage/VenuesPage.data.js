export const EMPTY_FORM = {
  name: '',
  street: '',
  streetNumber: '',
  postalCode: '',
  locality: '',
  province: '',
  googleMapsUrl: '',
};

export const REQUIRED_FIELDS = [
  ['name', 'El nombre del lugar es obligatorio.'],
  ['street', 'La calle es obligatoria.'],
  ['streetNumber', 'El número es obligatorio.'],
  ['postalCode', 'El código postal es obligatorio.'],
  ['locality', 'La localidad es obligatoria.'],
  ['province', 'La provincia es obligatoria.'],
];
