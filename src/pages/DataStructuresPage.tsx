import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';
import { Layers, ListOrdered, ArrowRightLeft, GitBranch, Share2, LayoutList } from 'lucide-react';
import { StackVisualizer } from '../components/visualizers/StackVisualizer';
import { QueueVisualizer } from '../components/visualizers/QueueVisualizer';
import { LinkedListVisualizer } from '../components/visualizers/LinkedListVisualizer';
import { TreeVisualizer } from '../components/visualizers/TreeVisualizer';
import { GraphVisualizer } from '../components/visualizers/GraphVisualizer';
import { ArrayVisualizer } from '../components/visualizers/ArrayVisualizer';
import { Toaster } from 'sonner';

type DSTab = 'array' | 'stack' | 'queue' | 'linkedlist' | 'tree' | 'graph';

const tabs: { key: DSTab; label: string; icon: React.ReactNode }[] = [
  { key: 'array', label: 'Array', icon: <LayoutList className="w-4 h-4" /> },
  { key: 'stack', label: 'Stack', icon: <Layers className="w-4 h-4" /> },
  { key: 'queue', label: 'Queue', icon: <ListOrdered className="w-4 h-4" /> },
  { key: 'linkedlist', label: 'Linked List', icon: <ArrowRightLeft className="w-4 h-4" /> },
  { key: 'tree', label: 'BST', icon: <GitBranch className="w-4 h-4" /> },
  { key: 'graph', label: 'Graph', icon: <Share2 className="w-4 h-4" /> },
];

export function DataStructuresPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<DSTab>('array');

  const renderVisualizer = () => {
    switch (activeTab) {
      case 'array':
        return <ArrayVisualizer />;
      case 'stack':
        return <StackVisualizer />;
      case 'queue':
        return <QueueVisualizer />;
      case 'linkedlist':
        return <LinkedListVisualizer />;
      case 'tree':
        return <TreeVisualizer />;
      case 'graph':
        return <GraphVisualizer />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <Navbar />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface-1)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
          },
        }}
      />

      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-brand-text font-title">
            {t('nav.dataStructures') || 'Data Structures'}
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
            Interactive visualizers for fundamental data structures — Stack, Queue, Linked List, BST & Graph
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'glow'
                  : 'border hover:border-[var(--brand-primary)]'
              }`}
              style={
                activeTab === tab.key
                  ? { background: 'var(--brand-primary)', color: 'var(--bg-primary)' }
                  : {
                      background: 'var(--surface-1)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-default)',
                    }
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Visualizer Content */}
        {renderVisualizer()}
      </div>
    </Layout>
  );
}
