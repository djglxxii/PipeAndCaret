/**
 * Diff Utilities for Change Highlighting
 * 
 * Simple comparison utilities to identify changed fields
 * between original and current message states.
 */

import type { HL7Message } from '../app/types';
import { serializeField } from '../hl7';

/**
 * Check if a specific field has changed from original
 */
export function hasFieldChanged(
  original: HL7Message | null,
  current: HL7Message | null,
  segmentIndex: number,
  fieldIndex: number
): boolean {
  if (!original || !current) return false;
  
  const originalSegment = original.segments[segmentIndex];
  const currentSegment = current.segments[segmentIndex];
  
  if (!originalSegment || !currentSegment) return false;
  
  const originalField = originalSegment.fields.find(f => f.index === fieldIndex);
  const currentField = currentSegment.fields.find(f => f.index === fieldIndex);
  
  // Both don't exist - no change
  if (!originalField && !currentField) return false;
  
  // One exists and other doesn't - changed
  if (!originalField || !currentField) return true;
  
  // Compare serialized values
  const originalValue = serializeField(originalField, original.delimiters);
  const currentValue = serializeField(currentField, current.delimiters);
  
  return originalValue !== currentValue;
}

/**
 * Check if a leaf value has changed
 */
export function hasLeafChanged(
  original: HL7Message | null,
  current: HL7Message | null,
  segmentIndex: number,
  fieldIndex: number,
  repeatIndex: number,
  componentIndex: number,
  subcomponentIndex: number
): boolean {
  if (!original || !current) return false;
  
  const getLeaf = (msg: HL7Message) => {
    const segment = msg.segments[segmentIndex];
    if (!segment) return undefined;
    
    const field = segment.fields.find(f => f.index === fieldIndex);
    if (!field) return undefined;
    
    const repeat = field.repeats[repeatIndex];
    if (!repeat) return undefined;
    
    const component = repeat.components[componentIndex];
    if (!component) return undefined;
    
    return component.subcomponents[subcomponentIndex]?.value;
  };
  
  const originalValue = getLeaf(original);
  const currentValue = getLeaf(current);
  
  return originalValue !== currentValue;
}

/**
 * Get set of changed field keys for highlighting
 * Key format: "segmentIndex:fieldIndex"
 */
export function getChangedFieldKeys(
  original: HL7Message | null,
  current: HL7Message | null
): Set<string> {
  const changed = new Set<string>();
  
  if (!original || !current) return changed;
  
  // Compare each segment/field
  const maxSegments = Math.max(original.segments.length, current.segments.length);
  
  for (let segIdx = 0; segIdx < maxSegments; segIdx++) {
    const origSeg = original.segments[segIdx];
    const currSeg = current.segments[segIdx];
    
    // Get all field indices from both segments
    const fieldIndices = new Set<number>();
    
    if (origSeg) {
      origSeg.fields.forEach(f => fieldIndices.add(f.index));
    }
    if (currSeg) {
      currSeg.fields.forEach(f => fieldIndices.add(f.index));
    }
    
    for (const fieldIdx of fieldIndices) {
      if (hasFieldChanged(original, current, segIdx, fieldIdx)) {
        changed.add(`${segIdx}:${fieldIdx}`);
      }
    }
  }
  
  return changed;
}

/**
 * Parse the original message from raw string for comparison
 * This is used when we need to compare against the original parsed state
 */
export function parseOriginalForDiff(_originalRaw: string): HL7Message | null {
  // Note: This function is not used in the current implementation.
  // If needed, import parseHL7 from '../hl7' at the top of the file.
  return null;
}
