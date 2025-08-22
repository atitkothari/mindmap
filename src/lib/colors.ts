// Color palette for mindmap branches - carefully selected for good contrast and accessibility
export const BRANCH_COLORS = [
  '#3B82F6', // Blue - primary
  '#10B981', // Green - success
  '#F59E0B', // Amber - warning
  '#EF4444', // Red - error
  '#8B5CF6', // Purple - secondary
  '#06B6D4', // Cyan - info
  '#F97316', // Orange - accent
  '#EC4899', // Pink - highlight
  '#84CC16', // Lime - fresh
  '#6366F1', // Indigo - deep
  '#14B8A6', // Teal - calm
  '#F43F5E', // Rose - vibrant
];

// Function to get a color for a branch based on its depth from root
export function getBranchColor(branchId: string, allNodes: any[], allEdges: any[]): string {
  // Find the root node (first node in the array)
  const rootNode = allNodes[0];
  if (!rootNode) return BRANCH_COLORS[0];

  // If this is the root node, use the first color
  if (branchId === rootNode.id) {
    return BRANCH_COLORS[0];
  }

  // Find the branch this node belongs to by tracing back to root
  const branchPath = findBranchPath(branchId, allNodes, allEdges);
  if (branchPath.length === 0) return BRANCH_COLORS[0];

  // Use the first node in the branch path (closest to root) to determine color
  const branchStartNode = branchPath[0];
  
  // Create a more deterministic color assignment based on branch position
  // Count how many branches exist at the same level
  const rootChildren = rootNode.children || [];
  const branchIndex = rootChildren.indexOf(branchStartNode.id);
  
  if (branchIndex >= 0) {
    // Use the branch index to assign colors in order
    return BRANCH_COLORS[Math.min(branchIndex, BRANCH_COLORS.length - 1)];
  }
  
  // For nodes that are not direct children of root, find their immediate parent
  // and assign a color based on the parent's position in the tree
  const parentEdge = allEdges.find(e => e.to === branchId);
  if (parentEdge) {
    const parentNode = allNodes.find(n => n.id === parentEdge.from);
    if (parentNode) {
      // Get the parent's branch color and create a variation
      const parentColor = getBranchColor(parentNode.id, allNodes, allEdges);
      const parentColorIndex = BRANCH_COLORS.indexOf(parentColor);
      if (parentColorIndex >= 0) {
        // Use a different color from the palette for this branch
        const childIndex = parentNode.children.indexOf(branchId);
        const colorIndex = (parentColorIndex + childIndex + 1) % BRANCH_COLORS.length;
        return BRANCH_COLORS[colorIndex];
      }
    }
  }
  
  // Fallback: use hash-based assignment
  const colorIndex = (branchStartNode.id.charCodeAt(0) + branchStartNode.id.charCodeAt(1)) % BRANCH_COLORS.length;
  return BRANCH_COLORS[colorIndex];
}

// Function to find the path from a node back to the root
function findBranchPath(nodeId: string, allNodes: any[], allEdges: any[]): any[] {
  const path: any[] = [];
  let currentNodeId = nodeId;
  
  while (currentNodeId) {
    const node = allNodes.find(n => n.id === currentNodeId);
    if (!node) break;
    
    path.unshift(node);
    
    // Find the parent edge
    const parentEdge = allEdges.find(e => e.to === currentNodeId);
    if (!parentEdge) break;
    
    currentNodeId = parentEdge.from;
  }
  
  return path;
}

// Function to get a lighter version of a color for borders
export function getLighterColor(color: string, alpha: number = 0.3): string {
  // Convert hex to RGB and add alpha
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Function to get a darker version of a color for borders
export function getDarkerColor(color: string, factor: number = 0.7): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const darkerR = Math.floor(r * factor);
  const darkerG = Math.floor(g * factor);
  const darkerB = Math.floor(b * factor);
  
  return `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
}
