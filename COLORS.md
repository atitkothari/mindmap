# Mindmap Color System

## Overview
The mindmap now features a sophisticated color system where each branch (starting from the root) gets a unique color for its edges and borders. This creates visual distinction between different branches and makes the mindmap easier to navigate and understand.

## Color Features

### Branch Colors
- **Root Node**: Blue (#3B82F6) - Primary color for the central node
- **Branch 1**: Green (#10B981) - Success/positive associations
- **Branch 2**: Amber (#F59E0B) - Warning/attention-grabbing
- **Branch 3**: Red (#EF4444) - Error/important concepts
- **Branch 4**: Purple (#8B5CF6) - Secondary/creative ideas
- **Branch 5**: Cyan (#06B6D4) - Information/technical concepts
- **Branch 6**: Orange (#F97316) - Accent/energetic ideas
- **Branch 7**: Pink (#EC4899) - Highlight/special concepts
- **Branch 8**: Lime (#84CC16) - Fresh/new ideas
- **Branch 9**: Indigo (#6366F1) - Deep/complex concepts
- **Branch 10**: Teal (#14B8A6) - Calm/balanced ideas
- **Branch 11**: Rose (#F43F5E) - Vibrant/passionate concepts

### Visual Elements
- **Node Borders**: Each node's border color matches its branch color (4px thickness)
- **Edges**: Edges between nodes use the same branch color (3px thickness)
- **Shadows**: Very subtle shadows for depth without being prominent
- **Hover Effects**: Enhanced visual feedback with subtle branch color rings

### Color Assignment Logic
1. **Root Node**: Always gets the primary blue color
2. **Direct Children**: Each direct child of the root gets a unique color based on creation order
3. **Sub-branches**: Each sub-branch gets its own unique color, ensuring visual distinction
4. **Consistency**: Colors remain consistent across sessions and updates
5. **Uniqueness**: Every branch at every level gets a distinct color from the palette

### Accessibility
- Colors are carefully selected for good contrast
- Multiple visual cues (borders, edges, subtle shadows) ensure visibility
- Hover states provide additional feedback without being overwhelming
- Selection states override branch colors for clear indication
- Shadows are kept minimal to avoid visual clutter while maintaining depth

## Technical Implementation

### Files Modified
- `src/lib/colors.ts` - Color utility functions and palette
- `src/components/Node.tsx` - Node border and shadow colors
- `src/components/Edge.tsx` - Edge stroke colors and effects
- `src/components/MindMapEditor.tsx` - Data passing for color calculation

### Key Functions
- `getBranchColor(nodeId, nodes, edges)` - Determines branch color for a node
- `getDarkerColor(color, factor)` - Creates darker variants for shadows
- `getLighterColor(color, alpha)` - Creates lighter variants for highlights

### Color Calculation
The system traces the path from any node back to the root to determine which branch it belongs to, ensuring consistent color assignment across the entire mindmap structure.
