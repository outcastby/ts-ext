import { Field } from '../../components/Form/interfaces'
import Dictionary from '../../interfaces/Dictionary'
import { getIn, setIn } from '../../utils/fp'
import v4 from 'uuid/v4'
import _ from 'lodash'

const SetEntity = {
  run: (fields: Field[], entity: Dictionary<any> = {}, parentPath: string | undefined = undefined): Dictionary<any> => {
    return fields.reduce((result, field) => {
      const { name } = field
      const fullPath = parentPath ? `${parentPath}.${name}` : name

      let value = getIn(entity, fullPath)

      value =
        field.fields && !field.type?.includes('[]')
          ? SetEntity.run(field.fields, entity, fullPath)
          : getValue(field, value)

      return setIn(result, name, value)
    }, {} as Dictionary<any>)
  },
}

const getValue = (field: Field, value: any): any => (value ? normalizeValue(field, value) : getDefaultValue(field))

const getDefaultValue = ({ allowEmpty, multiple, options, type, defaultValue }: Field): any => {
  if (defaultValue || defaultValue === false) return defaultValue
  if (type?.includes('[]')) return []
  if (allowEmpty) return

  if (_.isArray(options) && _.isObject(options[0])) {
    return multiple ? [] : options[0]?.value
  }
}

const normalizeValue = ({ fields, type, multiple, async }: Field, value: any): any => {
  if (type?.includes('[]')) return normalizedJSONList(fields, value)

  if (async) return value

  if (multiple && value?.every((v: any) => _.isObject(v))) {
    return value.map((v: { id: string | number }) => v.id)
  }

  return value
}

const normalizedJSONList = (fields: Field[] | undefined, values: any[]): any[] => {
  if (fields) {
    return values.map((v: {}) => ({ ...SetEntity.run(fields, v), __uuid: v4() }))
  } else {
    return values.map((v: {}) => ({ ...v, __uuid: v4() }))
  }
}

export default SetEntity
