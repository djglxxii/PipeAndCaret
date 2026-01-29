/**
 * HL7 v2 Message Serializer
 * 
 * Serializes the canonical hierarchical model back to raw HL7 text.
 */

import type {
  HL7Message,
  HL7Delimiters,
  SegmentNode,
  FieldNode,
  RepeatNode,
  ComponentNode,
} from '../app/types';

/**
 * Serialize a subcomponent to string (just the value)
 */
function serializeSubcomponents(
  components: ComponentNode,
  delimiters: HL7Delimiters
): string {
  return components.subcomponents.map(sub => sub.value).join(delimiters.subcomponent);
}

/**
 * Serialize components to string
 */
function serializeComponents(
  repeat: RepeatNode,
  delimiters: HL7Delimiters
): string {
  return repeat.components
    .map(comp => serializeSubcomponents(comp, delimiters))
    .join(delimiters.component);
}

/**
 * Serialize repeats to string
 */
function serializeRepeats(
  field: FieldNode,
  delimiters: HL7Delimiters
): string {
  return field.repeats
    .map(rep => serializeComponents(rep, delimiters))
    .join(delimiters.repeat);
}

/**
 * Serialize a field to string
 */
export function serializeField(
  field: FieldNode,
  delimiters: HL7Delimiters
): string {
  return serializeRepeats(field, delimiters);
}

/**
 * Serialize MSH segment with special handling
 * MSH-1 is the field delimiter itself, MSH-2 is encoding chars
 */
function serializeMSHSegment(
  segment: SegmentNode,
  delimiters: HL7Delimiters
): string {
  // Start with "MSH" followed by field delimiter
  let result = 'MSH' + delimiters.field;
  
  // MSH-2 (encoding characters) - comes right after MSH-1 (the delimiter)
  // Note: We don't add a delimiter before MSH-2 since MSH-1 IS the delimiter
  const msh2Field = segment.fields.find(f => f.index === 2);
  if (msh2Field) {
    result += serializeField(msh2Field, delimiters);
  } else {
    // Default encoding chars if not found
    result += `${delimiters.component}${delimiters.repeat}${delimiters.escape}${delimiters.subcomponent}`;
  }
  
  // Remaining fields (MSH-3 onwards)
  const otherFields = segment.fields
    .filter(f => f.index > 2)
    .sort((a, b) => a.index - b.index);
  
  // Fill in gaps and serialize
  let lastIndex = 2;
  for (const field of otherFields) {
    // Add empty fields for gaps
    for (let i = lastIndex + 1; i < field.index; i++) {
      result += delimiters.field;
    }
    result += delimiters.field + serializeField(field, delimiters);
    lastIndex = field.index;
  }
  
  return result;
}

/**
 * Serialize a non-MSH segment
 */
function serializeSegment(
  segment: SegmentNode,
  delimiters: HL7Delimiters
): string {
  // Start with segment name
  let result = segment.name;
  
  // Sort fields by index
  const sortedFields = [...segment.fields].sort((a, b) => a.index - b.index);
  
  // Serialize fields, filling gaps with empty fields
  let lastIndex = 0;
  for (const field of sortedFields) {
    // Add empty fields for gaps
    for (let i = lastIndex + 1; i < field.index; i++) {
      result += delimiters.field;
    }
    result += delimiters.field + serializeField(field, delimiters);
    lastIndex = field.index;
  }
  
  return result;
}

/**
 * Main serialize function
 * Serializes the entire message back to HL7 raw text
 * 
 * @param message The parsed HL7 message
 * @param includeTrailingTerminator Whether to add \r at the end (default: true)
 */
export function serializeHL7(
  message: HL7Message,
  includeTrailingTerminator: boolean = true
): string {
  const segments = message.segments.map((segment, index) => {
    if (segment.name === 'MSH' && index === 0) {
      return serializeMSHSegment(segment, message.delimiters);
    }
    return serializeSegment(segment, message.delimiters);
  });
  
  const result = segments.join(message.delimiters.segment);
  
  return includeTrailingTerminator ? result + message.delimiters.segment : result;
}

/**
 * Serialize a single segment (useful for optimized updates)
 */
export function serializeSingleSegment(
  segment: SegmentNode,
  delimiters: HL7Delimiters,
  isMSH: boolean = false
): string {
  if (isMSH) {
    return serializeMSHSegment(segment, delimiters);
  }
  return serializeSegment(segment, delimiters);
}

/**
 * Trim trailing empty fields/components/subcomponents from serialized output
 * This is optional but can produce cleaner output
 */
export function trimTrailingDelimiters(
  serialized: string,
  delimiters: HL7Delimiters
): string {
  // Trim trailing field delimiters from each segment
  const segments = serialized.split(delimiters.segment);
  const trimmed = segments.map(seg => {
    // Don't trim MSH segment as it has special handling
    if (seg.startsWith('MSH')) {
      return seg;
    }
    // Remove trailing field delimiters
    let result = seg;
    while (result.endsWith(delimiters.field)) {
      result = result.slice(0, -1);
    }
    return result;
  });
  
  return trimmed.join(delimiters.segment);
}
