import React, { useState } from 'react';
import {
  Layout, MagnifyingGlass, FunnelSimple, Star, Plus,
  Briefcase, Megaphone, TrendUp, Users, Code, PaintBrush,
  Gear, GraduationCap, User, Rocket
} from 'phosphor-react';
import type { Template, TemplateCategory } from './types';
import { featureLogger } from '@/utils/logger';

// =============================================================================
// TEMPLATES PAGE - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

const CATEGORIES: { id: TemplateCategory; label: string; icon: React.ElementType }[] = [
  { id: 'project_management', label: 'Project Management', icon: Briefcase },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'sales', label: 'Sales & CRM', icon: TrendUp },
  { id: 'hr', label: 'HR & Recruiting', icon: Users },
  { id: 'software', label: 'Software Dev', icon: Code },
  { id: 'design', label: 'Design', icon: PaintBrush },
  { id: 'operations', label: 'Operations', icon: Gear },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'startup', label: 'Startup', icon: Rocket },
];

const SAMPLE_TEMPLATES: Partial<Template>[] = [
  {
    id: '1',
    name: 'Project Tracker',
    description: 'Track projects with tasks, deadlines, and team assignments',
    category: 'project_management',
    usageCount: 15420,
    rating: 4.8,
    isPublic: true,
  },
  {
    id: '2',
    name: 'Content Calendar',
    description: 'Plan and schedule your content across all channels',
    category: 'marketing',
    usageCount: 8230,
    rating: 4.7,
    isPublic: true,
  },
  {
    id: '3',
    name: 'Sales Pipeline',
    description: 'Manage leads and track deals through your sales funnel',
    category: 'sales',
    usageCount: 12100,
    rating: 4.9,
    isPublic: true,
  },
  {
    id: '4',
    name: 'Sprint Board',
    description: 'Agile sprint management with backlog and burndown',
    category: 'software',
    usageCount: 9800,
    rating: 4.8,
    isPublic: true,
  },
  {
    id: '5',
    name: 'Employee Onboarding',
    description: 'Streamline new hire onboarding process',
    category: 'hr',
    usageCount: 5430,
    rating: 4.6,
    isPublic: true,
  },
  {
    id: '6',
    name: 'Design Requests',
    description: 'Manage design requests and creative briefs',
    category: 'design',
    usageCount: 4200,
    rating: 4.5,
    isPublic: true,
  },
];

export const TemplatesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null);

  const filteredTemplates = SAMPLE_TEMPLATES.filter((template) => {
    const matchesSearch = !searchQuery ||
      template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: Partial<Template>) => {
    // TODO: Implement template creation
    featureLogger.debug('[Templates] Use template - NOT IMPLEMENTED', template);
    alert(`Creating board from "${template.name}" template - Coming soon!`);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-stone-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Layout size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-200">
                Template Center
              </h1>
              <p className="text-sm text-stone-500">
                Start with a template to get up and running quickly
              </p>
            </div>
          </div>
          <span className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
          <FunnelSimple size={18} />
          Filters
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Categories */}
        <div className="w-64 border-r border-stone-200 dark:border-stone-800 p-4 overflow-y-auto">
          <h3 className="text-xs font-medium text-stone-500 uppercase mb-3">Categories</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                !selectedCategory
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Layout size={18} />
              All Templates
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <cat.icon size={18} />
                {cat.label}
              </button>
            ))}
          </div>

          {/* My Templates */}
          <div className="mt-6 pt-6 border-t border-stone-200 dark:border-stone-700">
            <h3 className="text-xs font-medium text-stone-500 uppercase mb-3">My Templates</h3>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
              <Plus size={18} />
              Create Template
            </button>
          </div>
        </div>

        {/* Main Content - Template Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Featured */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">
              {selectedCategory
                ? CATEGORIES.find((c) => c.id === selectedCategory)?.label
                : 'Featured Templates'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="h-32 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <Layout size={48} className="text-indigo-400 dark:text-indigo-500" />
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-medium text-stone-800 dark:text-stone-200">
                      {template.name}
                    </h3>
                    <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Star size={12} weight="fill" className="text-amber-400" />
                        {template.rating}
                      </span>
                      <span>{template.usageCount?.toLocaleString()} uses</span>
                    </div>

                    {/* Use Button */}
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full mt-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Layout size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
              <p className="text-stone-500">No templates found</p>
              <p className="text-sm text-stone-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;
