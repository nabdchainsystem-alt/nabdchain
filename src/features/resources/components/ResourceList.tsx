import React, { useState } from 'react';
import { User, MagnifyingGlass, Funnel, Plus, DotsThree, Clock, Briefcase, Tag } from 'phosphor-react';
import type { Resource } from '../types';

// =============================================================================
// RESOURCE LIST - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface ResourceListProps {
  resources: Resource[];
  onAddResource?: () => void;
  onEditResource?: (resourceId: string) => void;
}

export const ResourceList: React.FC<ResourceListProps> = ({
  resources,
  onAddResource,
  onEditResource,
}) => {
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  const filteredResources = resources.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterDepartment !== 'all' && r.department !== filterDepartment) {
      return false;
    }
    return true;
  });

  const departments = [...new Set(resources.map((r) => r.department).filter(Boolean))];

  const statusColors = {
    active: 'bg-green-500',
    away: 'bg-amber-500',
    unavailable: 'bg-stone-400',
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-10 pr-4 py-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <Funnel size={18} className="text-stone-400" />
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <button
          onClick={onAddResource}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
        >
          <Plus size={18} />
          Add Resource
        </button>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-3 gap-4">
        {filteredResources.map((resource) => (
          <div
            key={resource.id}
            className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {resource.avatar ? (
                  <img
                    src={resource.avatar}
                    alt={resource.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                    <User size={24} className="text-indigo-600" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-stone-800 dark:text-stone-200">
                      {resource.name}
                    </h4>
                    <span className={`w-2 h-2 rounded-full ${statusColors[resource.status]}`} />
                  </div>
                  <p className="text-sm text-stone-500">{resource.email}</p>
                </div>
              </div>
              <button
                onClick={() => onEditResource?.(resource.id)}
                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
              >
                <DotsThree size={18} className="text-stone-500" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              {resource.role && (
                <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                  <Briefcase size={14} />
                  <span>{resource.role}</span>
                </div>
              )}
              {resource.department && (
                <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                  <Tag size={14} />
                  <span>{resource.department}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                <Clock size={14} />
                <span>{resource.capacity}h/week capacity</span>
              </div>
            </div>

            {/* Skills */}
            {resource.skills.length > 0 && (
              <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <div className="flex flex-wrap gap-1">
                  {resource.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                  {resource.skills.length > 4 && (
                    <span className="px-2 py-0.5 text-xs text-stone-500">
                      +{resource.skills.length - 4}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="p-8 text-center">
          <User size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <p className="text-stone-500">No resources found</p>
        </div>
      )}

      {/* Placeholder Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Resource List - Full functionality coming soon
        </p>
      </div>
    </div>
  );
};

export default ResourceList;
