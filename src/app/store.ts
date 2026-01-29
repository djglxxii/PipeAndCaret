/**
 * Zustand Store for HL7 Message Editor
 * 
 * Central state management for the application.
 * The parsed message is the source of truth; raw output is derived.
 */

import { create } from 'zustand';
import type {
  HL7Message,
  HL7Path,
  ParseError,
  FieldNode,
} from './types';
import { parseHL7, serializeHL7, reparseFieldFromString } from '../hl7';

interface AppState {
  // Raw input/output
  rawInput: string;
  currentRaw: string;
  originalRaw: string;
  
  // Parsed message
  message: HL7Message | null;
  parseError: ParseError | null;
  
  // UI state
  isParsed: boolean;
  isEditingRaw: boolean;
  selectedPath: HL7Path | null;
  activeTab: 'grid' | 'tree';
  
  // Actions
  setRawInput: (input: string) => void;
  parseMessage: () => void;
  enableRawEditing: () => void;
  setSelectedPath: (path: HL7Path | null) => void;
  setActiveTab: (tab: 'grid' | 'tree') => void;
  
  // Edit actions
  updateLeafValue: (
    segmentIndex: number,
    fieldIndex: number,
    repeatIndex: number,
    componentIndex: number,
    subcomponentIndex: number,
    value: string
  ) => void;
  
  updateFieldFromString: (
    segmentIndex: number,
    fieldIndex: number,
    fieldString: string
  ) => void;
  
  // Reset
  reset: () => void;
}

// Debounce timer for serialization
let serializeTimeout: ReturnType<typeof setTimeout> | null = null;

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  rawInput: '',
  currentRaw: '',
  originalRaw: '',
  message: null,
  parseError: null,
  isParsed: false,
  isEditingRaw: false,
  selectedPath: null,
  activeTab: 'grid',
  
  setRawInput: (input: string) => {
    set({ rawInput: input });
  },
  
  parseMessage: () => {
    const { rawInput } = get();
    const result = parseHL7(rawInput);
    
    if (result.success) {
      const serialized = serializeHL7(result.message);
      set({
        message: result.message,
        parseError: null,
        isParsed: true,
        isEditingRaw: false,
        originalRaw: serialized,
        currentRaw: serialized,
        selectedPath: null,
      });
    } else {
      set({
        message: null,
        parseError: result.error,
        isParsed: false,
        currentRaw: '',
        originalRaw: '',
      });
    }
  },
  
  enableRawEditing: () => {
    const { currentRaw } = get();
    set({
      rawInput: currentRaw,
      isEditingRaw: true,
      isParsed: false,
      message: null,
      parseError: null,
      selectedPath: null,
    });
  },
  
  setSelectedPath: (path: HL7Path | null) => {
    set({ selectedPath: path });
  },
  
  setActiveTab: (tab: 'grid' | 'tree') => {
    set({ activeTab: tab });
  },
  
  updateLeafValue: (
    segmentIndex: number,
    fieldIndex: number,
    repeatIndex: number,
    componentIndex: number,
    subcomponentIndex: number,
    value: string
  ) => {
    const { message } = get();
    if (!message) return;
    
    // Deep clone the message to avoid mutation issues
    const newMessage = structuredClone(message);
    
    // Navigate to the leaf and update
    const segment = newMessage.segments[segmentIndex];
    if (!segment) return;
    
    let field = segment.fields.find(f => f.index === fieldIndex);
    
    // If field doesn't exist, create it
    if (!field) {
      field = {
        index: fieldIndex,
        repeats: [{
          components: [{
            subcomponents: [{ value: '' }]
          }]
        }]
      };
      segment.fields.push(field);
      segment.fields.sort((a, b) => a.index - b.index);
    }
    
    // Ensure repeat exists
    while (field.repeats.length <= repeatIndex) {
      field.repeats.push({
        components: [{
          subcomponents: [{ value: '' }]
        }]
      });
    }
    
    const repeat = field.repeats[repeatIndex];
    
    // Ensure component exists
    while (repeat.components.length <= componentIndex) {
      repeat.components.push({
        subcomponents: [{ value: '' }]
      });
    }
    
    const component = repeat.components[componentIndex];
    
    // Ensure subcomponent exists
    while (component.subcomponents.length <= subcomponentIndex) {
      component.subcomponents.push({ value: '' });
    }
    
    // Update the value
    component.subcomponents[subcomponentIndex].value = value;
    
    // Debounced serialization
    if (serializeTimeout) {
      clearTimeout(serializeTimeout);
    }
    
    serializeTimeout = setTimeout(() => {
      const serialized = serializeHL7(newMessage);
      set({ currentRaw: serialized });
    }, 150);
    
    set({ message: newMessage });
  },
  
  updateFieldFromString: (
    segmentIndex: number,
    fieldIndex: number,
    fieldString: string
  ) => {
    const { message } = get();
    if (!message) return;
    
    // Deep clone the message
    const newMessage = structuredClone(message);
    
    const segment = newMessage.segments[segmentIndex];
    if (!segment) return;
    
    // Parse the field string
    const newField = reparseFieldFromString(
      fieldString,
      newMessage.delimiters,
      fieldIndex
    );
    
    // Find and replace or add the field
    const existingFieldIdx = segment.fields.findIndex(f => f.index === fieldIndex);
    
    if (existingFieldIdx >= 0) {
      segment.fields[existingFieldIdx] = newField;
    } else {
      segment.fields.push(newField);
      segment.fields.sort((a, b) => a.index - b.index);
    }
    
    // Debounced serialization
    if (serializeTimeout) {
      clearTimeout(serializeTimeout);
    }
    
    serializeTimeout = setTimeout(() => {
      const serialized = serializeHL7(newMessage);
      set({ currentRaw: serialized });
    }, 150);
    
    set({ message: newMessage });
  },
  
  reset: () => {
    if (serializeTimeout) {
      clearTimeout(serializeTimeout);
    }
    set({
      rawInput: '',
      currentRaw: '',
      originalRaw: '',
      message: null,
      parseError: null,
      isParsed: false,
      isEditingRaw: false,
      selectedPath: null,
      activeTab: 'grid',
    });
  },
}));

/**
 * Selector for getting a specific field value
 */
export function getFieldValue(
  message: HL7Message | null,
  segmentIndex: number,
  fieldIndex: number
): FieldNode | null {
  if (!message) return null;
  
  const segment = message.segments[segmentIndex];
  if (!segment) return null;
  
  return segment.fields.find(f => f.index === fieldIndex) || null;
}

/**
 * Selector for getting a leaf value
 */
export function getLeafValue(
  message: HL7Message | null,
  segmentIndex: number,
  fieldIndex: number,
  repeatIndex: number,
  componentIndex: number,
  subcomponentIndex: number
): string {
  if (!message) return '';
  
  const field = getFieldValue(message, segmentIndex, fieldIndex);
  if (!field) return '';
  
  const repeat = field.repeats[repeatIndex];
  if (!repeat) return '';
  
  const component = repeat.components[componentIndex];
  if (!component) return '';
  
  const subcomponent = component.subcomponents[subcomponentIndex];
  if (!subcomponent) return '';
  
  return subcomponent.value;
}
