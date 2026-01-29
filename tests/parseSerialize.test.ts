/**
 * HL7 Parser and Serializer Tests
 * 
 * Tests round-trip integrity: parse → serialize → parse
 */

import { describe, it, expect } from 'vitest';
import { parseHL7, serializeHL7 } from '../src/hl7';

// Sample HL7 messages for testing
const SIMPLE_MESSAGE = `MSH|^~\\&|SENDING|FACILITY|RECEIVING|FACILITY|20231215120000||ADT^A01|MSG001|P|2.5\rPID|1||12345^^^MRN||DOE^JOHN^Q||19800115|M`;

const MESSAGE_WITH_REPEATS = `MSH|^~\\&|SEND|FAC|RECV|FAC|20231215||ADT^A01|123|P|2.5\rPID|1||12345||DOE^JOHN~SMITH^JANE||19800101|M`;

const MESSAGE_WITH_SUBCOMPONENTS = `MSH|^~\\&|SEND|FAC|RECV|FAC|20231215||ADT^A01|123|P|2.5\rPID|1||12345||DOE^JOHN&JR||19800101|M`;

const MESSAGE_WITH_ALL_DELIMITERS = `MSH|^~\\&|SEND|FAC|RECV|FAC|20231215||ADT^A01|123|P|2.5\rPID|1||12345||DOE^JOHN&JR~SMITH^JANE&SR||19800101|M\rOBX|1|NM|HEIGHT||180|cm|150-200|N|||F`;

const COMPLEX_MESSAGE = `MSH|^~\\&|LAB|FACILITY|EHR|FACILITY|20231215140000||ORU^R01|LAB123456|P|2.5
PID|1||PATIENT123^^^HOSP^MR||SMITH^JOHN^A^III||19850315|M|||123 MAIN ST^APT 4^ANYTOWN^CA^12345^USA||5551234567^HOME~5559876543^CELL||EN|M|CAT||123456789|DL12345678
OBR|1|ORDER123|ACCN456|CBC^COMPLETE BLOOD COUNT^L|||20231215100000|||||||20231215103000||JONES^MARY^DR|||||20231215140000|||F
OBX|1|NM|WBC^WHITE BLOOD CELL COUNT^L||7.5|10*3/uL|4.5-11.0|N|||F
OBX|2|NM|RBC^RED BLOOD CELL COUNT^L||4.8|10*6/uL|4.5-5.5|N|||F
OBX|3|NM|HGB^HEMOGLOBIN^L||14.2|g/dL|13.5-17.5|N|||F`;

describe('HL7 Parser', () => {
  it('should parse a simple HL7 message', () => {
    const result = parseHL7(SIMPLE_MESSAGE);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message.segments.length).toBe(2);
      expect(result.message.segments[0].name).toBe('MSH');
      expect(result.message.segments[1].name).toBe('PID');
    }
  });

  it('should extract correct delimiters from MSH', () => {
    const result = parseHL7(SIMPLE_MESSAGE);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message.delimiters.field).toBe('|');
      expect(result.message.delimiters.component).toBe('^');
      expect(result.message.delimiters.repeat).toBe('~');
      expect(result.message.delimiters.escape).toBe('\\');
      expect(result.message.delimiters.subcomponent).toBe('&');
    }
  });

  it('should parse MSH-1 and MSH-2 correctly', () => {
    const result = parseHL7(SIMPLE_MESSAGE);
    
    expect(result.success).toBe(true);
    if (result.success) {
      const msh = result.message.segments[0];
      
      // MSH-1 should be the field delimiter
      const msh1 = msh.fields.find(f => f.index === 1);
      expect(msh1?.repeats[0].components[0].subcomponents[0].value).toBe('|');
      
      // MSH-2 should be the encoding characters
      const msh2 = msh.fields.find(f => f.index === 2);
      expect(msh2?.repeats[0].components[0].subcomponents[0].value).toBe('^~\\&');
    }
  });

  it('should parse repeating fields', () => {
    const result = parseHL7(MESSAGE_WITH_REPEATS);
    
    expect(result.success).toBe(true);
    if (result.success) {
      const pid = result.message.segments[1];
      const pidField5 = pid.fields.find(f => f.index === 5);
      
      expect(pidField5?.repeats.length).toBe(2);
      expect(pidField5?.repeats[0].components[0].subcomponents[0].value).toBe('DOE');
      expect(pidField5?.repeats[1].components[0].subcomponents[0].value).toBe('SMITH');
    }
  });

  it('should parse subcomponents', () => {
    const result = parseHL7(MESSAGE_WITH_SUBCOMPONENTS);
    
    expect(result.success).toBe(true);
    if (result.success) {
      const pid = result.message.segments[1];
      const pidField5 = pid.fields.find(f => f.index === 5);
      
      // JOHN&JR has 2 subcomponents
      const secondComponent = pidField5?.repeats[0].components[1];
      expect(secondComponent?.subcomponents.length).toBe(2);
      expect(secondComponent?.subcomponents[0].value).toBe('JOHN');
      expect(secondComponent?.subcomponents[1].value).toBe('JR');
    }
  });

  it('should fail on missing MSH', () => {
    const result = parseHL7('PID|1||12345');
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('MSH');
    }
  });

  it('should fail on empty input', () => {
    const result = parseHL7('');
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('No segments');
    }
  });

  it('should handle different line endings', () => {
    // \n line endings
    const withLF = SIMPLE_MESSAGE.replace(/\r/g, '\n');
    const result1 = parseHL7(withLF);
    expect(result1.success).toBe(true);

    // \r\n line endings
    const withCRLF = SIMPLE_MESSAGE.replace(/\r/g, '\r\n');
    const result2 = parseHL7(withCRLF);
    expect(result2.success).toBe(true);
  });

  it('should parse a complex multi-segment message', () => {
    const result = parseHL7(COMPLEX_MESSAGE);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message.segments.length).toBe(6);
      expect(result.message.segments.map(s => s.name)).toEqual([
        'MSH', 'PID', 'OBR', 'OBX', 'OBX', 'OBX'
      ]);
    }
  });
});

describe('HL7 Serializer', () => {
  it('should serialize a parsed message back to HL7', () => {
    const result = parseHL7(SIMPLE_MESSAGE);
    
    expect(result.success).toBe(true);
    if (result.success) {
      const serialized = serializeHL7(result.message);
      
      // Should contain segment names
      expect(serialized).toContain('MSH|');
      expect(serialized).toContain('PID|');
    }
  });

  it('should preserve MSH-1 and MSH-2', () => {
    const result = parseHL7(SIMPLE_MESSAGE);
    
    expect(result.success).toBe(true);
    if (result.success) {
      const serialized = serializeHL7(result.message);
      
      // Should start with MSH|^~\&|
      expect(serialized).toMatch(/^MSH\|\^~\\&\|/);
    }
  });

  it('should preserve repeating fields', () => {
    const result = parseHL7(MESSAGE_WITH_REPEATS);
    
    expect(result.success).toBe(true);
    if (result.success) {
      const serialized = serializeHL7(result.message);
      
      // Should contain the ~ delimiter for repeats
      expect(serialized).toContain('DOE^JOHN~SMITH^JANE');
    }
  });

  it('should preserve subcomponents', () => {
    const result = parseHL7(MESSAGE_WITH_SUBCOMPONENTS);
    
    expect(result.success).toBe(true);
    if (result.success) {
      const serialized = serializeHL7(result.message);
      
      // Should contain the & delimiter for subcomponents
      expect(serialized).toContain('JOHN&JR');
    }
  });

  it('should use \\r as segment delimiter', () => {
    const result = parseHL7(SIMPLE_MESSAGE);
    
    expect(result.success).toBe(true);
    if (result.success) {
      const serialized = serializeHL7(result.message);
      
      // Should contain \r between segments
      expect(serialized).toContain('\r');
    }
  });
});

describe('Round-trip Integrity', () => {
  const testRoundTrip = (input: string, description: string) => {
    it(`should maintain structural integrity for: ${description}`, () => {
      // Parse original
      const parseResult1 = parseHL7(input);
      expect(parseResult1.success).toBe(true);
      
      if (!parseResult1.success) return;
      
      // Serialize
      const serialized = serializeHL7(parseResult1.message);
      
      // Parse again
      const parseResult2 = parseHL7(serialized);
      expect(parseResult2.success).toBe(true);
      
      if (!parseResult2.success) return;
      
      // Compare structures
      const msg1 = parseResult1.message;
      const msg2 = parseResult2.message;
      
      // Same number of segments
      expect(msg2.segments.length).toBe(msg1.segments.length);
      
      // Same segment names
      expect(msg2.segments.map(s => s.name)).toEqual(msg1.segments.map(s => s.name));
      
      // Same delimiters
      expect(msg2.delimiters).toEqual(msg1.delimiters);
      
      // Deep compare fields for each segment
      for (let i = 0; i < msg1.segments.length; i++) {
        const seg1 = msg1.segments[i];
        const seg2 = msg2.segments[i];
        
        // Check each field exists and has same structure
        for (const field1 of seg1.fields) {
          const field2 = seg2.fields.find(f => f.index === field1.index);
          expect(field2).toBeDefined();
          
          if (field2) {
            // Same number of repeats
            expect(field2.repeats.length).toBe(field1.repeats.length);
            
            // Check each repeat
            for (let r = 0; r < field1.repeats.length; r++) {
              const rep1 = field1.repeats[r];
              const rep2 = field2.repeats[r];
              
              // Same number of components
              expect(rep2.components.length).toBe(rep1.components.length);
              
              // Check each component
              for (let c = 0; c < rep1.components.length; c++) {
                const comp1 = rep1.components[c];
                const comp2 = rep2.components[c];
                
                // Same number of subcomponents
                expect(comp2.subcomponents.length).toBe(comp1.subcomponents.length);
                
                // Check each subcomponent value
                for (let s = 0; s < comp1.subcomponents.length; s++) {
                  expect(comp2.subcomponents[s].value).toBe(comp1.subcomponents[s].value);
                }
              }
            }
          }
        }
      }
    });
  };

  testRoundTrip(SIMPLE_MESSAGE, 'simple message');
  testRoundTrip(MESSAGE_WITH_REPEATS, 'message with repeats (~)');
  testRoundTrip(MESSAGE_WITH_SUBCOMPONENTS, 'message with subcomponents (&)');
  testRoundTrip(MESSAGE_WITH_ALL_DELIMITERS, 'message with all delimiters');
  testRoundTrip(COMPLEX_MESSAGE, 'complex multi-segment message');
});

describe('Custom Delimiters', () => {
  it('should handle custom field delimiter', () => {
    const customMessage = 'MSH#^~\\&#SEND#FAC#RECV#FAC#20231215##ADT^A01#123#P#2.5\rPID#1##12345##DOE^JOHN##19800101#M';
    const result = parseHL7(customMessage);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message.delimiters.field).toBe('#');
      
      const serialized = serializeHL7(result.message);
      expect(serialized).toContain('#');
      expect(serialized).not.toContain('|');
    }
  });

  it('should handle custom encoding characters', () => {
    const customMessage = 'MSH|!@$%|SEND|FAC|RECV|FAC|20231215||ADT!A01|123|P|2.5\rPID|1||12345||DOE!JOHN||19800101|M';
    const result = parseHL7(customMessage);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message.delimiters.component).toBe('!');
      expect(result.message.delimiters.repeat).toBe('@');
      expect(result.message.delimiters.escape).toBe('$');
      expect(result.message.delimiters.subcomponent).toBe('%');
      
      const serialized = serializeHL7(result.message);
      expect(serialized).toContain('DOE!JOHN');
    }
  });
});

describe('Edge Cases', () => {
  it('should handle trailing segment delimiter', () => {
    const withTrailing = SIMPLE_MESSAGE + '\r';
    const result = parseHL7(withTrailing);
    
    expect(result.success).toBe(true);
    if (result.success) {
      // Should not create empty segment
      expect(result.message.segments.every(s => s.name.length > 0)).toBe(true);
    }
  });

  it('should handle empty fields', () => {
    const withEmpty = 'MSH|^~\\&|SEND||RECV||20231215||ADT^A01|123|P|2.5\rPID|1||||DOE^JOHN||19800101|M';
    const result = parseHL7(withEmpty);
    
    expect(result.success).toBe(true);
    if (result.success) {
      // Serialize and parse again
      const serialized = serializeHL7(result.message);
      const result2 = parseHL7(serialized);
      
      expect(result2.success).toBe(true);
    }
  });

  it('should handle minimum valid MSH', () => {
    const minimal = 'MSH|^~\\&';
    const result = parseHL7(minimal);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.message.segments.length).toBe(1);
      expect(result.message.segments[0].name).toBe('MSH');
    }
  });
});
