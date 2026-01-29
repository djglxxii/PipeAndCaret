/**
 * Field Re-parsing Utilities
 * 
 * Used when a user edits a field string in the grid and the string
 * contains delimiters that need to be parsed into the structured model.
 */

import type { HL7Delimiters, FieldNode } from '../app/types';
import { parseFieldString } from './parse';
import { serializeField } from './serialize';

/**
 * Re-parse a field string when edited in the grid
 * This handles the case where a user types delimiters into a cell
 */
export function reparseFieldFromString(
  fieldString: string,
  delimiters: HL7Delimiters,
  fieldIndex: number
): FieldNode {
  return parseFieldString(fieldString, delimiters, fieldIndex);
}

/**
 * Check if a string contains any HL7 delimiters
 */
export function containsDelimiters(
  value: string,
  delimiters: HL7Delimiters
): boolean {
  return (
    value.includes(delimiters.repeat) ||
    value.includes(delimiters.component) ||
    value.includes(delimiters.subcomponent)
  );
}

/**
 * Get a flat string representation of a field (for display in grid)
 */
export function getFieldDisplayString(
  field: FieldNode,
  delimiters: HL7Delimiters
): string {
  return serializeField(field, delimiters);
}

/**
 * Create a simple field from a single value (no repeats/components/subcomponents)
 */
export function createSimpleField(value: string, fieldIndex: number): FieldNode {
  return {
    index: fieldIndex,
    repeats: [{
      components: [{
        subcomponents: [{ value }]
      }]
    }]
  };
}

/**
 * Get the simple value from a field if it has only one repeat/component/subcomponent
 */
export function getSimpleFieldValue(field: FieldNode): string | null {
  if (
    field.repeats.length === 1 &&
    field.repeats[0].components.length === 1 &&
    field.repeats[0].components[0].subcomponents.length === 1
  ) {
    return field.repeats[0].components[0].subcomponents[0].value;
  }
  return null;
}

/**
 * Check if a field is simple (only one repeat/component/subcomponent)
 */
export function isSimpleField(field: FieldNode): boolean {
  return (
    field.repeats.length === 1 &&
    field.repeats[0].components.length === 1 &&
    field.repeats[0].components[0].subcomponents.length === 1
  );
}
