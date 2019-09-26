import { BufferMeta } from "./buffer-utils"
import { SerializedError } from "./error-utils"

export type ObjectMember = {
  name: string,
  value?: any,
  enumerable?: boolean,
  writable?: boolean,
  type?: 'method' | 'get'
}

export type ObjProtoDescriptor = {
  members: ObjectMember[],
  proto: ObjProtoDescriptor
} | null

export type MetaType = {
  type: 'object' | 'function',
  name: string,
  members: ObjectMember[],
  proto: ObjProtoDescriptor,
  id: number,
} | {
  type: 'value',
  value: any,
} | {
  type: 'buffer',
  value: BufferMeta,
} | {
  type: 'array',
  members: MetaType[]
} | {
  type: 'error',
  members: ObjectMember[]
} | {
  type: 'exception',
  value: SerializedError,
} | {
  type: 'date',
  value: number
} | {
  type: 'promise',
  then: MetaType
}


export type MetaTypeFromRenderer = {
  type: 'value',
  value: any
} | {
  type: 'remote-object',
  id: number
} | {
  type: 'array',
  value: MetaTypeFromRenderer[]
} | {
  type: 'buffer',
  value: BufferMeta
} | {
  type: 'date',
  value: number
} | {
  type: 'promise',
  then: MetaTypeFromRenderer
} | {
  type: 'object',
  name: string,
  members: { name: string, value: MetaTypeFromRenderer }[]
} | {
  type: 'function-with-return-value',
  value: MetaTypeFromRenderer
} | {
  type: 'function',
  id: number,
  location: string,
  length: number
}