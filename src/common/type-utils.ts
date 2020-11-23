import { getElectronBinding } from './get-electron-binding'
const { nativeImage } = getElectronBinding('native_image');

export function isPromise (val: any) {
  return (
    val &&
    val.then &&
    val.then instanceof Function &&
    val.constructor &&
    val.constructor.reject &&
    val.constructor.reject instanceof Function &&
    val.constructor.resolve &&
    val.constructor.resolve instanceof Function
  );
}

const serializableTypes = [
  Boolean,
  Number,
  String,
  Date,
  Error,
  RegExp,
  ArrayBuffer
];

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#Supported_types
export function isSerializableObject (value: any) {
  return value === null || ArrayBuffer.isView(value) || serializableTypes.some(type => value instanceof type);
}

const objectMap = function (source: Object, mapper: (value: any) => any) {
  const sourceEntries = Object.entries(source);
  const targetEntries = sourceEntries.map(([key, val]) => [key, mapper(val)]);
  return Object.fromEntries(targetEntries);
};

function serializeNativeImage (image: any) {
  const representations = [];
  const scaleFactors = image.getScaleFactors();

  for (const scaleFactor of scaleFactors) {
    const size = image.getSize(scaleFactor);
    const buffer = image.toBitmap({ scaleFactor });
    representations.push({ scaleFactor, size, buffer });
  }
  return { __ELECTRON_SERIALIZED_NativeImage__: true, representations };
}

function deserializeNativeImage (value: any) {
  const image = nativeImage.createEmpty();

  for (const rep of value.representations) {
    const { buffer, size, scaleFactor } = rep;
    const { width, height } = size;
    image.addRepresentation({ buffer, scaleFactor, width, height });
  }

  return image;
}

export function serialize (value: any): any {
  if (value && value.constructor && value.constructor.name === 'NativeImage') {
    return serializeNativeImage(value);
  } if (Array.isArray(value)) {
    return value.map(serialize);
  } else if (isSerializableObject(value)) {
    return value;
  } else if (value instanceof Object) {
    return objectMap(value, serialize);
  } else {
    return value;
  }
}

export function deserialize (value: any): any {
  if (value && value.__ELECTRON_SERIALIZED_NativeImage__) {
    return deserializeNativeImage(value);
  } else if (Array.isArray(value)) {
    return value.map(deserialize);
  } else if (isSerializableObject(value)) {
    return value;
  } else if (value instanceof Object) {
    return objectMap(value, deserialize);
  } else {
    return value;
  }
}
