
# **HL7 Message Editor (name of the app is  PipeAndCaret) — Requirements & Design Specification**

## 1. Overview

The HL7 Message Editor is a **client-side, anonymous web application** that allows users to paste a raw HL7 v2.x message, parse it into a structured hierarchical model, view it in both **spreadsheet (grid)** and **tree** formats, edit any part of the message (down to subcomponents), and automatically reflect those edits back into the serialized HL7 message string.

All parsing, editing, and serialization occur **entirely in the browser**. No data is persisted or transmitted.

---

## 2. Goals

* Parse arbitrary HL7 v2.x messages using delimiter rules defined in the message itself.
* Support deep HL7 structure:

  * Segment
  * Field
  * Repeating Field
  * Component
  * Subcomponent
* Provide two complementary editing experiences:

  * **Spreadsheet-style grid editing** for speed and bulk changes
  * **Tree/Inspector editing** for deep, precise edits
* Guarantee **round-trip integrity**:

  * Parse → Edit → Serialize produces a valid HL7 message reflecting edits
* Require **no authentication, no accounts, no backend**

---

## 3. Non-Goals (MVP)

* No HL7 conformance profile validation
* No semantic field dictionaries (e.g., “PID-5 = Patient Name”)
* No message storage, history, or sharing
* No server-side processing of HL7 content

---

## 4. Privacy & Security Posture

* Application operates entirely client-side
* No telemetry, logging, or analytics involving message content
* Designed to safely handle PHI by **never transmitting data**
* Static hosting only

---

## 5. Target Users

* Engineers, analysts, and support staff working with HL7 messages
* Users who need to inspect, troubleshoot, or modify HL7 messages quickly
* No user roles; all users have identical capabilities

---

## 6. Supported HL7 Structure

### 6.1 Message Parsing Rules

* **Segment delimiter**: carriage return (`\r`)

  * Accept `\n` and `\r\n` on input; normalize internally
* **Field delimiter**: defined by **MSH-1** (character 4 of MSH segment)
* **Encoding characters**: defined by **MSH-2**

  * Component separator
  * Repetition separator
  * Escape character
  * Subcomponent separator

### 6.2 Hierarchy Model

```
Message
 └─ Segment (ordered)
     └─ Field (ordered, HL7 index-based)
         └─ Repeat (ordered)
             └─ Component (ordered)
                 └─ Subcomponent (value)
```

### 6.3 MSH Special Handling

* Field delimiter is not part of the delimited field list
* MSH-2 is treated as a normal field in the internal model
* Field indexing must follow HL7 conventions even if internally 0-based

---

## 7. Canonical Data Model

The parsed structure is the **single source of truth**.

```ts
type HL7Message = {
  delimiters: {
    segment: "\r";
    field: string;
    repeat: string;
    component: string;
    subcomponent: string;
    escape: string;
  };
  segments: SegmentNode[];
};

type SegmentNode = {
  name: string;
  fields: FieldNode[];
};

type FieldNode = {
  index: number;              // HL7 field position (1-based)
  repeats: RepeatNode[];
};

type RepeatNode = {
  components: ComponentNode[];
};

type ComponentNode = {
  subcomponents: SubcomponentNode[];
};

type SubcomponentNode = {
  value: string;
};
```

### Design Guarantees

* Arrays are always present (no nulls)
* Single-value fields still have:

  * 1 repeat
  * 1 component
  * 1 subcomponent
* This simplifies UI logic and editing behavior

---

## 8. Editing & Synchronization Rules

### 8.1 Source of Truth

* After parsing, the **structured model** becomes canonical
* The raw HL7 text is **derived via serialization**

### 8.2 Editing Flow

1. User edits a value (grid cell or tree leaf)
2. Update corresponding node in the parsed model
3. Re-serialize:

   * Prefer segment-level serialization
   * Full-message serialization acceptable for MVP
4. Update raw HL7 output

### 8.3 Raw HL7 Text Editing

* Raw textarea is editable **only before parsing**
* After parse:

  * Textarea becomes read-only
  * “Edit Raw (Re-parse)” toggle warns user and discards structured edits

---

## 9. UI Architecture

## 9.1 Technology Stack

* **Framework**: React + TypeScript
* **Build**: Vite
* **State Management**: Zustand
* **Grid (Spreadsheet)**: AG Grid (Community)
* **Tree View**: Dedicated tree component (non-grid)
* **UI Components**: Mantine
* **Hosting**: Static hosting only

---

## 9.2 Layout

```
+--------------------------------------------------+
| Raw HL7 Text Area        [Parse] [Errors]        |
+--------------------------------------------------+
| Tabs: [Grid View] [Tree View]                    |
+--------------------------------------------------+
| Main View (Grid or Tree) | Inspector Panel       |
+--------------------------------------------------+
| [Copy HL7] [Download .hl7]                       |
+--------------------------------------------------+
```

---

## 10. Grid View (Spreadsheet)

### 10.1 Purpose

* Fast scanning and editing
* Keyboard navigation
* Copy/paste
* Bulk updates

### 10.2 Row Model

* Each row = **one segment occurrence**
* Example:

  ```
  PID (row 0)
  OBX (row 1)
  OBX (row 2)
  ```

### 10.3 Columns

* `Seg` — segment name
* `#` — occurrence index
* `Field 1 … Field N` (configurable, default 1–10)

### 10.4 Cell Behavior

* Display **raw field string** (including `~ ^ &`)
* Inline edit:

  * Simple value → update directly
  * Delimited value → re-parse field only
* Expand action:

  * Opens structured editor (drawer/popover)
  * Allows editing repeats/components/subcomponents safely

---

## 11. Tree View

### Purpose

* Precise inspection and editing of deeply nested structures

### Structure

```
PID
 └─ PID-5
     └─ Repeat 1
         └─ Component 1
             └─ Subcomponent 1 (editable)
```

### Features

* Expand/collapse
* Node selection updates inspector
* Highlights edits relative to original parsed state

---

## 12. Inspector Panel

* Shows selected node path (e.g., `PID-5[1].1.1`)
* Provides context-aware editor:

  * Simple input for leaf values
  * Structured list for repeats/components
* All edits update canonical model

---

## 13. Error Handling

* Parsing errors must include:

  * Segment index
  * Segment name (if available)
  * Field index (if applicable)
* User-friendly error messages
* No silent failures

---

## 14. Performance Requirements

* Handle messages with hundreds of segments
* Virtualized rendering for grid and tree
* Debounced serialization on edit (150–300ms)

---

## 15. Export & Output

* **Copy to clipboard**
* **Download `.hl7` file**
* No autosave
* No persistence

---

## 16. Testing Strategy

* Unit tests:

  * Parse → serialize → parse structural equivalence
  * Delimiter handling (custom MSH)
* UI tests:

  * Grid edit updates raw HL7
  * Tree edit updates grid and raw HL7
* Regression tests for MSH edge cases

---

## 17. Future Enhancements (Out of Scope)

* HL7 field dictionaries and labels
* Message templates (ADT, ORU, etc.)
* Diff view (original vs edited)
* Profile validation
* Shareable links
