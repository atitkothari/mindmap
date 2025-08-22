# MindMap - Infinite Canvas Mind Mapping

A powerful mind mapping tool built with Next.js 14, TypeScript, and TailwindCSS. Create, edit, and organize your thoughts with an intuitive infinite canvas interface.

## ✨ Features

### 🧠 Core Mind Mapping
- **Infinite Canvas**: Navigate freely across your mind map
- **Smart Nodes**: Create, edit, and organize nodes with inline text editing
- **Hierarchical Structure**: Build parent-child relationships with automatic edge connections
- **Collapsible Branches**: Hide/show sections to focus on what matters

### ⌨️ Keyboard Shortcuts
- **Tab** → Create child node
- **Enter** → Create sibling node  
- **Delete** → Remove node and all children
- **Escape** → Deselect current node
- **Double-click** → Edit node text

### 🎨 User Experience
- **Dark/Light Mode**: Toggle between themes with system preference detection
- **Drag & Drop**: Reposition nodes by dragging them around the canvas
- **Auto-save**: All changes are automatically saved to localStorage
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 📁 Project Management
- **Dashboard**: View all your mind maps in one place
- **Create/Delete**: Start new projects or clean up old ones
- **Duplicate**: Clone existing maps as starting points
- **Rename**: Keep your projects organized with descriptive names

### 📤 Export Options
- **JSON**: Export your mind map data for backup or sharing
- **PNG/SVG**: Image export (coming soon)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mindmap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard page
│   ├── editor/[mapId]/    # Mind map editor
│   └── layout.tsx         # Root layout with providers
├── components/            # React components
│   ├── MindMapEditor.tsx  # Main editor component
│   ├── Node.tsx          # Individual node component
│   ├── Edge.tsx          # Connection lines
│   ├── Toolbar.tsx       # Export and tools
│   ├── ThemeToggle.tsx   # Dark/light mode toggle
│   └── ToastContext.tsx  # Notification system
├── lib/                   # Utilities and storage
│   └── storage.ts        # localStorage management
└── styles/               # Global styles
    └── globals.css       # TailwindCSS and custom styles
```

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React hooks + localStorage
- **Icons**: Lucide React
- **Theme**: next-themes

## 📱 Usage

### Creating Your First Mind Map

1. **Start at the Dashboard**
   - Click "New Map" to create your first project
   - Give it a descriptive name

2. **Build Your Structure**
   - The root node is automatically created
   - Double-click to edit the text
   - Use Tab to create child nodes
   - Use Enter to create sibling nodes

3. **Organize and Connect**
   - Drag nodes to reposition them
   - The system automatically creates connections
   - Collapse branches to focus on specific areas

### Managing Multiple Maps

- **Dashboard**: View all your projects at a glance
- **Quick Actions**: Rename, duplicate, or delete maps
- **Auto-save**: Never lose your work

## 🔧 Customization

### Adding New Node Types
Extend the `MindMapNode` interface in `src/lib/storage.ts`:

```typescript
export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  children: string[];
  collapsed?: boolean;
  // Add your custom properties here
  color?: string;
  icon?: string;
}
```

### Custom Styling
Modify the TailwindCSS classes in the component files or add custom CSS in `src/styles/globals.css`.

## 🚧 Roadmap

- [ ] **PNG/SVG Export**: High-quality image export
- [ ] **Collaboration**: Real-time shared editing
- [ ] **Templates**: Pre-built mind map structures
- [ ] **Cloud Sync**: Backup to cloud storage
- [ ] **Mobile App**: Native mobile experience
- [ ] **Advanced Layouts**: Automatic node positioning algorithms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)
- Inspired by modern mind mapping tools

---

**Happy Mind Mapping! 🧠✨**
