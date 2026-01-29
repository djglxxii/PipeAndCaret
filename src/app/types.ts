/**
 * HL7 v2 Message Data Model
 * 
 * Structure follows the HL7 v2 hierarchy:
 * Message -> Segment -> Field -> Repeat -> Component -> Subcomponent
 * 
 * All arrays are always present (never null/undefined) to simplify UI logic.
 * Even single values are wrapped in arrays at each level.
 */

export interface HL7Delimiters {
  segment: '\r';
  field: string;       // Usually |
  repeat: string;      // Usually ~
  component: string;   // Usually ^
  subcomponent: string; // Usually &
  escape: string;      // Usually \
}

export interface SubcomponentNode {
  value: string;
}

export interface ComponentNode {
  subcomponents: SubcomponentNode[];
}

export interface RepeatNode {
  components: ComponentNode[];
}

export interface FieldNode {
  index: number;  // 1-based HL7 field index
  repeats: RepeatNode[];
}

export interface SegmentNode {
  name: string;
  fields: FieldNode[];
}

export interface HL7Message {
  delimiters: HL7Delimiters;
  segments: SegmentNode[];
}

/**
 * Path representation for navigating to a specific location in the message.
 * Used for selecting and editing specific values.
 */
export interface HL7Path {
  segmentIndex: number;
  fieldIndex?: number;       // 1-based HL7 field index
  repeatIndex?: number;      // 0-based
  componentIndex?: number;   // 0-based
  subcomponentIndex?: number; // 0-based
}

/**
 * Parse error information for user feedback
 */
export interface ParseError {
  message: string;
  segmentIndex?: number;
  segmentName?: string;
  fieldIndex?: number;
  snippet?: string;
}

/**
 * Application state for a parsed message
 */
export interface ParsedMessageState {
  message: HL7Message;
  originalRaw: string;      // Original input for diff highlighting
  currentRaw: string;       // Current serialized output
  parseError: ParseError | null;
}

/**
 * Helper to format a path as a human-readable string
 * e.g., "PID-5[1].1.1" for PID segment, field 5, repeat 1, component 1, subcomponent 1
 */
export function formatPath(
  segmentName: string,
  fieldIndex: number,
  repeatIndex?: number,
  componentIndex?: number,
  subcomponentIndex?: number
): string {
  let path = `${segmentName}-${fieldIndex}`;
  
  if (repeatIndex !== undefined) {
    path += `[${repeatIndex + 1}]`;
  }
  
  if (componentIndex !== undefined) {
    path += `.${componentIndex + 1}`;
  }
  
  if (subcomponentIndex !== undefined) {
    path += `.${subcomponentIndex + 1}`;
  }
  
  return path;
}

/**
 * Helper to get a default delimiters object with standard HL7 delimiters
 */
export function getDefaultDelimiters(): HL7Delimiters {
  return {
    segment: '\r',
    field: '|',
    repeat: '~',
    component: '^',
    subcomponent: '&',
    escape: '\\',
  };
}
