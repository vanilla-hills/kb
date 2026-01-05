import React, { useState, useEffect } from 'react';
import { 
  Search, Menu, Plus, Edit2, Trash2, X, Save, 
  Copy, Check, ChevronDown, ChevronUp, Folder,
  Sun, Moon
} from 'lucide-react';
import AuthSplash from './components/AuthSplash';

// --- Initial Data (Seed) ---
const initialCategories = [
  { id: 'cat-agents', name: 'Custom Agents' },
  { id: 'cat-writing', name: 'Writing' },
  { id: 'cat-school', name: 'School Work' },
  { id: 'cat-ai', name: 'AI' },
  { id: 'cat-coding', name: 'Coding' },
  { id: 'cat-n8n', name: 'n8n' }
];

const initialContent = [
  {
    id: 1,
    title: 'React Component Generator',
    category: 'Coding',
    content: `Act as an expert React developer. Create a functional component using hooks and Tailwind CSS.
    
Requirements:
- Use lucide-react for icons
- Ensure responsive design
- Handle loading and error states`
  },
  {
    id: 2,
    title: 'Essay Outliner',
    category: 'School Work',
    content: `Create a detailed outline for an academic essay about [TOPIC].
    
Include:
1. Thesis statement
2. 3 Main arguments with supporting evidence
3. Counter-argument and rebuttal
4. Conclusion`
  },
  {
    id: 3,
    title: 'Customer Support Agent',
    category: 'Custom Agents',
    content: `You are a helpful customer support agent for a SaaS company.
    
Tone: Professional, empathetic, and concise.
Goal: Resolve the user's issue with their billing account.
    
User Query: "I was charged twice for this month's subscription."`
  },
  {
    id: 4,
    title: 'Blog Post Generator',
    category: 'Writing',
    content: `Write a comprehensive blog post about "The Future of AI in Education".
    
Structure:
- Catchy Headline
- Introduction with a hook
- 3 Key Trends
- Potential Challenges
- Conclusion
    
Target Audience: Teachers and EdTech administrators.`
  },
  {
    id: 5,
    title: 'n8n Webhook Handler',
    category: 'n8n',
    content: `Write a JavaScript code snippet for an n8n Function node.
    
Task:
- Receive JSON data from a webhook.
- Filter out items where "status" is not "active".
- Return the filtered list.`
  },
  {
    id: 6,
    title: 'Explain Quantum Computing',
    category: 'AI',
    content: `Explain the concept of Quantum Computing to a 10-year-old.
    
Use analogies involving everyday objects. Avoid complex jargon. Focus on the difference between bits and qubits.`
  },
  {
    id: 7,
    title: 'Python Data Analysis',
    category: 'Coding',
    content: `Write a Python script using Pandas to analyze a CSV file named "sales_data.csv".
    
Steps:
1. Load the data.
2. Calculate total sales per region.
3. Find the top-selling product.
4. Print the results.`
  },
  {
    id: 8,
    title: 'Study Schedule Creator',
    category: 'School Work',
    content: `Create a 5-day study schedule for a Biology final exam.
    
Topics to cover:
- Cell Structure
- Genetics
- Evolution
- Ecology
    
Include breaks and review sessions.`
  }
];

export default function App() {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('kb_auth') === 'true';
  });

  // --- Theme State ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('kb_theme');
    return saved ? saved === 'dark' : true; // Default to dark
  });

  // --- Data State ---
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('kb_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('kb_cards');
    return saved ? JSON.parse(saved) : initialContent;
  });

  // --- UI State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  // --- Persistence ---
  useEffect(() => { localStorage.setItem('kb_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('kb_cards', JSON.stringify(cards)); }, [cards]);
  
  // Theme Effect
  useEffect(() => {
    localStorage.setItem('kb_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Handlers ---
  const handleLogin = () => {
    localStorage.setItem('kb_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('kb_auth');
    setIsAuthenticated(false);
  };

  const handleSaveCard = (draft) => {
    if (draft.id) {
      setCards(prev => prev.map(c => c.id === draft.id ? draft : c));
    } else {
      const newCard = { ...draft, id: Date.now() };
      setCards(prev => [newCard, ...prev]);
    }
    setIsEditModalOpen(false);
    setEditingCard(null);
  };

  const handleDeleteCard = (cardId) => {
    if (!window.confirm('Delete this prompt?')) return;
    setCards(prev => prev.filter(c => c.id !== cardId));
    if (editingCard?.id === cardId) {
      setIsEditModalOpen(false);
      setEditingCard(null);
    }
  };

  const filteredCards = cards.filter(card => {
    const matchesSearch = (card.title + card.content).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || card.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isAuthenticated) return <AuthSplash onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-200">
      
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col shrink-0 overflow-hidden`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 flex items-center justify-center shrink-0 font-bold text-white rounded-sm">
            KB
          </div>
          <span className="font-bold text-lg tracking-tight truncate">Prompt Library</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <button 
            onClick={() => setSelectedCategory('All')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${selectedCategory === 'All' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Folder className="w-4 h-4" />
            All Prompts
          </button>
          
          <div className="pt-4 pb-2 px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Categories</div>
          
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${selectedCategory === cat.name ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400 border-l-2 border-blue-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <span className="truncate">{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4" /> Light Mode
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" /> Dark Mode
              </>
            )}
          </button>
          <button onClick={handleLogout} className="w-full py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm text-slate-500 dark:text-slate-400">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative max-w-2xl w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-sm pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>
          <button
            onClick={() => {
              setEditingCard({ title: '', category: categories[0]?.name || 'General', content: '' });
              setIsEditModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Prompt
          </button>
        </header>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {filteredCards.map(card => (
              <PromptCard 
                key={card.id} 
                card={card} 
                onEdit={() => {
                  setEditingCard(card);
                  setIsEditModalOpen(true);
                }}
              />
            ))}
          </div>
          
          {filteredCards.length === 0 && (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500">
              No prompts found matching your criteria.
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditModal
          card={editingCard}
          categories={categories}
          onClose={() => { setIsEditModalOpen(false); setEditingCard(null); }}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
        />
      )}
    </div>
  );
}

// --- Sub-components ---

function PromptCard({ card, onEdit }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(card.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col h-fit transition-all hover:border-slate-300 dark:hover:border-slate-700 group shadow-sm hover:shadow-md">
      {/* Title Banner */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 group-hover:bg-gray-100 dark:group-hover:bg-slate-800/60 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate select-none">{card.title}</h3>
          <span className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-950 text-slate-500 border border-slate-200 dark:border-slate-800 rounded-full uppercase tracking-wider shrink-0">
            {card.category}
          </span>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-sm transition-colors"
            title="Copy Prompt"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button 
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-sm transition-colors"
            title="Edit Prompt"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white dark:bg-slate-950/30">
        <div 
          className={`font-mono text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed ${isExpanded ? '' : 'line-clamp-4'}`}
        >
          {card.content}
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 flex items-center justify-center gap-1 text-xs font-medium text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 py-1 border-t border-slate-100 dark:border-slate-800/50 transition-colors"
        >
          {isExpanded ? (
            <>Show Less <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>Show More <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      </div>
    </div>
  );
}

function EditModal({ card, categories, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(card || {});

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{card.id ? 'Edit Prompt' : 'New Prompt'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
            <input
              type="text"
              value={draft.title}
              onChange={e => setDraft({ ...draft, title: e.target.value })}
              className="w-full bg-gray-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-sm px-3 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Prompt Title"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
            <select
              value={draft.category}
              onChange={e => setDraft({ ...draft, category: e.target.value })}
              className="w-full bg-gray-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-sm px-3 py-2 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prompt Content</label>
            <textarea
              value={draft.content}
              onChange={e => setDraft({ ...draft, content: e.target.value })}
              className="w-full h-64 bg-gray-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-sm px-3 py-2 text-sm font-mono text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              placeholder="Enter your prompt here..."
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center">
          {card.id ? (
            <button 
              onClick={() => onDelete(card.id)}
              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          ) : <div />}
          
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium">
              Cancel
            </button>
            <button 
              onClick={() => onSave(draft)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-sm shadow-lg shadow-blue-900/20"
            >
              Save Prompt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
