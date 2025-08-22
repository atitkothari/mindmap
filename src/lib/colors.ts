import { MindMapNode, MindMapEdge } from "@/lib/storage";

// Color palette for mindmap branches - carefully selected for good contrast and accessibility
// Note: Blue (#3B82F6) is reserved for node selection, so it's not included here
// Using more muted, softer shades for better visual comfort
export const BRANCH_COLORS = [
  '#6B7280', // Muted gray - success
  '#D97706', // Muted amber - warning
  '#DC2626', // Muted red - error
  '#7C3AED', // Muted purple - secondary
  '#0891B2', // Muted cyan - info
  '#EA580C', // Muted orange - accent
  '#DB2777', // Muted pink - highlight
  '#65A30D', // Muted lime - fresh
  '#4F46E5', // Muted indigo - deep
  '#0D9488', // Muted teal - calm
  '#E11D48', // Muted rose - vibrant
];

// Function to get a color for a branch based on its root branch
export function getBranchColor(branchId: string, allNodes: MindMapNode[], allEdges: MindMapEdge[]): string {
  // Find the root node (first node in the array)
  const rootNode = allNodes[0];
  if (!rootNode) return BRANCH_COLORS[0];

  // If this is the root node, use a neutral color (not blue to avoid confusion with selection)
  if (branchId === rootNode.id) {
    return '#9CA3AF'; // Muted gray - neutral color for root node
  }

  // Find the root branch this node belongs to by tracing back to the first level
  const rootBranchId = findRootBranchId(branchId, allNodes, allEdges);
  if (!rootBranchId) return BRANCH_COLORS[0];

  // If this is a root branch (direct child of root), assign a color based on its position
  if (rootBranchId === branchId) {
    const rootChildren = rootNode.children || [];
    const branchIndex = rootChildren.indexOf(branchId);
    if (branchIndex >= 0) {
      return BRANCH_COLORS[Math.min(branchIndex, BRANCH_COLORS.length - 1)];
    }
  }

  // For all other nodes, return the color of their root branch
  const rootBranchColor = getBranchColor(rootBranchId, allNodes, allEdges);
  return rootBranchColor;
}

// Function to find the root branch ID (first level branch) for a given node
function findRootBranchId(nodeId: string, allNodes: MindMapNode[], allEdges: MindMapEdge[]): string | null {
  const rootNode = allNodes[0];
  if (!rootNode) return null;

  // If this is already a root branch, return it
  if (rootNode.children && rootNode.children.includes(nodeId)) {
    return nodeId;
  }

  // Trace back to find the root branch
  let currentNodeId = nodeId;
  let rootBranchId: string | null = null;

  while (currentNodeId) {
    const node = allNodes.find(n => n.id === currentNodeId);
    if (!node) break;

    // Check if this node is a direct child of root
    if (rootNode.children && rootNode.children.includes(currentNodeId)) {
      rootBranchId = currentNodeId;
      break;
    }

    // Find the parent edge
    const parentEdge = allEdges.find(e => e.to === currentNodeId);
    if (!parentEdge) break;

    currentNodeId = parentEdge.from;
  }

  return rootBranchId;
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
