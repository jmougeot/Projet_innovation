# Table Components Architecture

## Overview

The large `Table.tsx` file has been split into logical, smaller components to improve maintainability and code organization. The new structure follows a modular approach with clear separation of concerns.

## Directory Structure

```
app/service/components/table/
├── index.ts                    # Main export file
├── types/
│   └── table.types.ts         # All TypeScript interfaces and types
├── constants/
│   └── table.constants.ts     # Configuration constants (shapes, sizes)
├── utils/
│   └── table.utils.ts         # Utility functions and hooks
├── styles/
│   └── table.styles.ts        # All StyleSheet definitions
└── components/
    ├── TableShapeRenderer.tsx       # Individual table shape rendering
    ├── TableShapePreview.tsx        # Table shape selection preview
    ├── TableViewWithShapeRenderer.tsx # Base view with legend and edit mode
    └── TableComponent.tsx           # Main modal component
```

## Components

### 1. TableShapeRenderer
- **Purpose**: Renders individual table shapes with different styles (round, square, rectangle, oval)
- **Location**: `components/TableShapeRenderer.tsx`
- **Key Features**:
  - Dynamic sizing based on workspace dimensions
  - Shape-specific styling
  - Text and places indicator display
  - Responsive font sizing

### 2. TableShapePreview
- **Purpose**: Shows table shape options in the modal for selection
- **Location**: `components/TableShapePreview.tsx`
- **Key Features**:
  - Visual preview of each table shape
  - Selection state management
  - Status color integration

### 3. TableViewWithShapeRenderer
- **Purpose**: Base layout component with common UI elements
- **Location**: `components/TableViewWithShapeRenderer.tsx`
- **Key Features**:
  - Header and navigation integration
  - Legend display
  - Edit mode toggle
  - Loading states

### 4. TableComponent (Main Modal)
- **Purpose**: Main table creation/editing modal
- **Location**: `components/TableComponent.tsx`
- **Key Features**:
  - Form validation
  - Shape selection
  - Dynamic styling based on workspace dimensions
  - Font loading management

## Types and Interfaces

### Key Types
- `TableShape`: Union type for available table shapes
- `TableShapeRendererProps`: Props for the shape renderer component
- `TableViewBaseProps`: Props for the base view component
- `TableComponentProps`: Props for the main modal component
- `TableShapeOption`: Configuration object for table shapes

## Utils and Hooks

### useWorkspaceDimensions
- Provides workspace-based dimensions instead of screen dimensions
- Used for responsive sizing across all components

### Status Functions
- `getStatusColor()`: Returns color based on table status
- `getStatusText()`: Returns display text for status
- `getNextStatus()`: Cycles through status values

## Constants

### TABLE_SHAPES
Configuration array defining all available table shapes with:
- Shape type and display name
- Icon and description
- Min/max capacity constraints

## Styles

All styles are organized in `table.styles.ts` with three main StyleSheet objects:
- `baseStyles`: Common layout and UI styles
- `tableShapeStyles`: Specific to table shape rendering
- `tableModalStyles`: Modal-specific styles

## Migration Notes

### Backward Compatibility
The main `Table.tsx` file now acts as a re-export entry point, maintaining full backward compatibility with existing imports.

### Import Examples
```typescript
// Import everything (recommended for new code)
import { TableShapeRenderer, TableViewWithShapeRenderer, getStatusColor } from '@/app/service/components/Table';

// Import specific components
import { TableShapeRenderer } from '@/app/service/components/table/components/TableShapeRenderer';

// Import the main component (unchanged)
import TableComponent from '@/app/service/components/Table';
```

## Benefits

### Maintainability
- Each component has a single responsibility
- Easier to locate and modify specific functionality
- Reduced file size makes code reviews more manageable

### Reusability
- Components can be used independently
- Shared types and utilities across the module
- Consistent styling through centralized style definitions

### Testing
- Smaller components are easier to unit test
- Clear separation of business logic and UI components
- Isolated utility functions for testing

### Development Experience
- Better IDE navigation and autocomplete
- Clearer file structure for new developers
- Reduced merge conflicts with multiple developers

## Future Enhancements

### Potential Improvements
1. **Component Composition**: Further break down large components
2. **Hook Extraction**: Move more logic to custom hooks
3. **Style Theming**: Implement a theme system for consistent colors
4. **Performance**: Add React.memo for optimization where needed
5. **Accessibility**: Add accessibility props and ARIA labels

### Adding New Table Shapes
1. Add the new shape to the `TableShape` type
2. Update the `TABLE_SHAPES` constant
3. Add shape-specific styling in the renderer components
4. Update validation logic if needed
