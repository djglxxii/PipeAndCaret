/**
 * HL7 v2 Message Parser
 * 
 * Parses raw HL7 text into the canonical hierarchical model.
 * Handles delimiter extraction from MSH segment.
 */

import type {
  HL7Message,
  HL7Delimiters,
  SegmentNode,
  FieldNode,
  RepeatNode,
  ComponentNode,
  SubcomponentNode,
  ParseError,
} from '../app/types';

export type ParseResult = 
  | { success: true; message: HL7Message }
  | { success: false; error: ParseError };

/**
 * Normalize line endings to \r for consistent segment splitting
 */
function normalizeLineEndings(input: string): string {
  // Replace \r\n first, then \n, to normalize to \r
  return input.replace(/\r\n/g, '\r').replace(/\n/g, '\r');
}

/**
 * Extract delimiters from MSH segment
 */
function extractDelimiters(mshLine: string): HL7Delimiters | null {
  // MSH must start with "MSH" and have at least 8 characters for minimal delimiters
  if (!mshLine.startsWith('MSH') || mshLine.length < 8) {
    return null;
  }

  // Field delimiter is character at position 3 (0-indexed)
  const fieldDelim = mshLine[3];
  
  // Encoding characters are in MSH-2, which starts at position 4
  // Standard encoding chars: ^~\&
  const encodingChars = mshLine.substring(4, mshLine.indexOf(fieldDelim, 4));
  
  if (encodingChars.length < 4) {
    // Fall back to defaults if encoding chars are incomplete
    return {
      segment: '\r',
      field: fieldDelim,
      component: encodingChars[0] || '^',
      repeat: encodingChars[1] || '~',
      escape: encodingChars[2] || '\\',
      subcomponent: encodingChars[3] || '&',
    };
  }

  return {
    segment: '\r',
    field: fieldDelim,
    component: encodingChars[0],
    repeat: encodingChars[1],
    escape: encodingChars[2],
    subcomponent: encodingChars[3],
  };
}

/**
 * Parse a field string into repeats/components/subcomponents
 */
function parseField(
  fieldString: string,
  delimiters: HL7Delimiters,
  fieldIndex: number
): FieldNode {
  const repeats: RepeatNode[] = [];
  
  // Split by repeat delimiter
  const repeatStrings = fieldString.split(delimiters.repeat);
  
  for (const repeatStr of repeatStrings) {
    const components: ComponentNode[] = [];
    
    // Split by component delimiter
    const componentStrings = repeatStr.split(delimiters.component);
    
    for (const componentStr of componentStrings) {
      const subcomponents: SubcomponentNode[] = [];
      
      // Split by subcomponent delimiter
      const subcomponentStrings = componentStr.split(delimiters.subcomponent);
      
      for (const subStr of subcomponentStrings) {
        subcomponents.push({ value: subStr });
      }
      
      components.push({ subcomponents });
    }
    
    repeats.push({ components });
  }
  
  return {
    index: fieldIndex,
    repeats,
  };
}

/**
 * Parse the MSH segment with special handling
 * MSH is unique because the field delimiter itself is MSH-1
 */
function parseMSHSegment(mshLine: string, delimiters: HL7Delimiters): SegmentNode {
  const fields: FieldNode[] = [];
  
  // MSH-1 is the field delimiter itself (character at position 3)
  fields.push({
    index: 1,
    repeats: [{
      components: [{
        subcomponents: [{ value: delimiters.field }]
      }]
    }]
  });
  
  // MSH-2 is the encoding characters (positions 4 through next delimiter)
  const afterDelim = mshLine.substring(4);
  const firstDelimPos = afterDelim.indexOf(delimiters.field);
  const encodingChars = firstDelimPos >= 0 
    ? afterDelim.substring(0, firstDelimPos)
    : afterDelim;
  
  fields.push({
    index: 2,
    repeats: [{
      components: [{
        subcomponents: [{ value: encodingChars }]
      }]
    }]
  });
  
  // Parse remaining fields (MSH-3 onwards)
  if (firstDelimPos >= 0) {
    const remainingFields = afterDelim.substring(firstDelimPos + 1).split(delimiters.field);
    
    for (let i = 0; i < remainingFields.length; i++) {
      fields.push(parseField(remainingFields[i], delimiters, i + 3));
    }
  }
  
  return {
    name: 'MSH',
    fields,
  };
}

/**
 * Parse a non-MSH segment
 */
function parseSegment(
  segmentLine: string,
  delimiters: HL7Delimiters,
  segmentIndex: number
): SegmentNode | ParseError {
  const parts = segmentLine.split(delimiters.field);
  
  if (parts.length === 0 || parts[0].length === 0) {
    return {
      message: 'Empty or invalid segment',
      segmentIndex,
      snippet: segmentLine.substring(0, 50),
    };
  }
  
  const name = parts[0];
  
  // Validate segment name (should be 3 uppercase letters typically)
  if (!/^[A-Z][A-Z0-9]{2}$/.test(name)) {
    return {
      message: `Invalid segment name: "${name}"`,
      segmentIndex,
      segmentName: name,
      snippet: segmentLine.substring(0, 50),
    };
  }
  
  const fields: FieldNode[] = [];
  
  // Parse fields (starting from index 1 for non-MSH segments)
  for (let i = 1; i < parts.length; i++) {
    fields.push(parseField(parts[i], delimiters, i));
  }
  
  return {
    name,
    fields,
  };
}

/**
 * Main parse function
 * Parses raw HL7 text into the canonical model
 */
export function parseHL7(rawInput: string): ParseResult {
  // Normalize line endings
  const normalized = normalizeLineEndings(rawInput.trim());
  
  // Split into segments
  const segmentLines = normalized.split('\r').filter(line => line.length > 0);
  
  if (segmentLines.length === 0) {
    return {
      success: false,
      error: {
        message: 'No segments found in input',
      },
    };
  }
  
  // First segment must be MSH
  if (!segmentLines[0].startsWith('MSH')) {
    return {
      success: false,
      error: {
        message: 'HL7 message must start with MSH segment',
        snippet: segmentLines[0].substring(0, 50),
      },
    };
  }
  
  // Extract delimiters from MSH
  const delimiters = extractDelimiters(segmentLines[0]);
  
  if (!delimiters) {
    return {
      success: false,
      error: {
        message: 'Could not extract delimiters from MSH segment',
        segmentIndex: 0,
        segmentName: 'MSH',
        snippet: segmentLines[0].substring(0, 50),
      },
    };
  }
  
  const segments: SegmentNode[] = [];
  
  // Parse MSH segment
  segments.push(parseMSHSegment(segmentLines[0], delimiters));
  
  // Parse remaining segments
  for (let i = 1; i < segmentLines.length; i++) {
    const result = parseSegment(segmentLines[i], delimiters, i);
    
    if ('message' in result) {
      // It's an error
      return {
        success: false,
        error: result,
      };
    }
    
    segments.push(result);
  }
  
  return {
    success: true,
    message: {
      delimiters,
      segments,
    },
  };
}

/**
 * Parse a single field string (used when editing a cell that contains delimiters)
 */
export function parseFieldString(
  fieldString: string,
  delimiters: HL7Delimiters,
  fieldIndex: number
): FieldNode {
  return parseField(fieldString, delimiters, fieldIndex);
}

/**
 * Validate that a string looks like valid HL7 (basic check)
 */
export function isValidHL7(input: string): boolean {
  const normalized = normalizeLineEndings(input.trim());
  return normalized.startsWith('MSH') && normalized.length > 8;
}
