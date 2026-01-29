# PipeAndCaret - HL7 Message Editor

An anonymous, client-side HL7 v2 message editor with parsing, spreadsheet-style editing, tree view, and round-trip serialization.

## Features

- **Parse HL7 Messages**: Paste raw HL7 text and parse it into a structured hierarchical model
- **Spreadsheet View**: AG Grid-powered spreadsheet for fast editing with keyboard navigation
- **Tree View**: Hierarchical tree view for precise deep edits down to subcomponents
- **Inspector Panel**: Context-aware editor for selected nodes
- **Round-Trip Serialization**: Edits immediately reflect in the serialized output
- **Export**: Copy to clipboard or download as `.hl7` file
- **Change Highlighting**: Visual indicators for modified fields

## Privacy & Security

- **100% Client-Side**: All processing happens in the browser
- **No Backend**: No servers, no authentication, no accounts
- **No Telemetry**: No data is transmitted anywhere
- **Safe for PHI**: Designed to handle sensitive data by never transmitting it

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm 9+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

### Testing

```bash
npm run test
```

### Build

```bash
npm run build
```

## Usage

1. **Paste HL7 Message**: Enter or paste a raw HL7 message into the textarea
2. **Parse**: Click the "Parse" button to parse the message
3. **Edit**: Use either:
   - **Grid View**: Click cells to edit field values directly
   - **Tree View**: Navigate the hierarchy and edit values in the Inspector
4. **Export**: Copy the updated message or download as a `.hl7` file
5. **Re-edit Raw**: Toggle "Edit Raw (Re-parse)" to modify the raw input again

### Example HL7 Message

```
MSH|^~\&|SENDING|FACILITY|RECEIVING|FACILITY|20231215120000||ADT^A01|MSG001|P|2.5
PID|1||12345^^^MRN||DOE^JOHN^Q||19800115|M
PV1|1|I|ICU^101^A||||1234^SMITH^MARY^DR|||MED||||ADM|||||VIS123
OBX|1|NM|HEIGHT||180|cm|150-200|N|||F
```

## Technical Details

### HL7 Structure

The parser creates a hierarchical model:

```
Message
 └─ Segment (ordered)
     └─ Field (ordered, HL7 index-based)
         └─ Repeat (ordered)
             └─ Component (ordered)
                 └─ Subcomponent (value)
```

### Delimiter Handling

- **Field delimiter**: Extracted from MSH-1 (character 4 of MSH segment)
- **Encoding characters**: Extracted from MSH-2
  - Component separator (default: `^`)
  - Repeat separator (default: `~`)
  - Escape character (default: `\`)
  - Subcomponent separator (default: `&`)
- **Segment delimiter**: Normalized to `\r` internally

### MSH Special Handling

- MSH-1 is the field delimiter itself (not delimited)
- MSH-2 contains the encoding characters
- Field indices align with HL7 conventions

### Serialization

- Segments are joined with `\r`
- Trailing `\r` is added at the end
- Empty trailing fields are preserved

## Tech Stack

- **React** + **TypeScript**: UI framework
- **Vite**: Build tool and dev server
- **Zustand**: State management
- **AG Grid Community**: Spreadsheet grid component
- **Mantine**: UI component library
- **Vitest**: Testing framework

## Project Structure

```
src/
├── app/
│   ├── store.ts      # Zustand store
│   └── types.ts      # TypeScript types
├── hl7/
│   ├── parse.ts      # HL7 parser
│   ├── serialize.ts  # HL7 serializer
│   ├── fieldReparse.ts # Field-level parsing utilities
│   └── index.ts      # Module exports
├── components/
│   ├── RawPanel.tsx      # Raw input/output textarea
│   ├── EditorTabs.tsx    # Tab container
│   ├── GridView.tsx      # AG Grid spreadsheet
│   ├── TreeView.tsx      # Hierarchical tree
│   ├── InspectorPanel.tsx # Node editor
│   └── ExportBar.tsx     # Copy/download buttons
├── utils/
│   ├── diff.ts       # Change detection
│   ├── clipboard.ts  # Clipboard operations
│   └── download.ts   # File download
├── App.tsx           # Main app component
└── main.tsx          # Entry point
tests/
└── parseSerialize.test.ts # Parser/serializer tests
```

## Limitations (MVP)

- **No HL7 semantic validation**: The editor doesn't validate field content against HL7 specifications
- **No conformance profiles**: No support for HL7 conformance profile validation
- **No field dictionaries**: Field names (e.g., "PID-5 = Patient Name") are not displayed
- **No escape sequence handling**: Escape sequences are preserved as-is
- **Fixed column count**: Grid displays fields 1-10 (configurable in future)

## Browser Support

Modern browsers with ES2020 support:
- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

## License

ISC

## Contributing

This is an MVP. Contributions are welcome for:
- HL7 field dictionaries and labels
- Message templates (ADT, ORU, etc.)
- Diff view (original vs edited)
- Profile validation
- Performance optimizations
