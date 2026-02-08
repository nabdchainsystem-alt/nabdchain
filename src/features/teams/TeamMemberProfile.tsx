import React, { useState } from 'react';
import { ArrowLeft, Envelope, MapPin, Bank, Star, Clock, CheckCircle, DotsThree, User } from 'phosphor-react';
import { TeamMember, TeamRole } from './types';

interface TeamMemberProfileProps {
  member: TeamMember;
  onBack: () => void;
}

import { useAppContext } from '../../contexts/AppContext';

export const TeamMemberProfile: React.FC<TeamMemberProfileProps> = ({ member, onBack }) => {
  const { t } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'activity'>('overview');

  if (!member) return <div className="p-8 text-center">Member not found</div>;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-monday-dark-surface animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-monday-dark-border">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} className="rtl:rotate-180" />
          <span className="font-medium">{t('back_to_team')}</span>
        </button>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-monday-blue text-white rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm text-sm">
            {t('message_btn')}
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <DotsThree size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          {/* Hero Section */}
          <div className="flex flex-col md:flex-row gap-8 mb-10">
            <div
              className={`w-32 h-32 rounded-2xl ${member.color} flex items-center justify-center text-white text-4xl font-bold shadow-lg flex-shrink-0`}
            >
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.name} className="w-full h-full rounded-2xl object-cover" />
              ) : member.showUserIcon ? (
                <User size={64} weight="fill" />
              ) : (
                member.initials
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{member.name}</h1>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        member.status === 'Active'
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                          : member.status === 'Invited'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-green-500' : member.status === 'Invited' ? 'bg-yellow-500' : 'bg-gray-400'}`}
                      ></div>
                      {t(member.status.toLowerCase())}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 dark:text-gray-300 font-medium flex items-center gap-1">
                      {member.role === TeamRole.ADMIN && <Star weight="fill" className="text-yellow-400" size={16} />}
                      {t(member.role.toLowerCase() === 'member' ? 'member_role' : member.role.toLowerCase())}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Envelope size={18} className="text-gray-400" />
                  {member.email}
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Bank size={18} className="text-gray-400" />
                  {member.department} {t('department')}
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <MapPin size={18} className="text-gray-400" />
                  {member.location || 'Remote'}
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Clock size={18} className="text-gray-400" />
                  {t('last_active_prefix')} {member.lastActive}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-gray-50 dark:bg-monday-dark-bg p-5 rounded-xl border border-gray-100 dark:border-monday-dark-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                  <CheckCircle size={20} weight="fill" />
                </div>
                <span className="font-medium text-gray-600 dark:text-gray-300">{t('tasks_completed')}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white pl-11">124</h3>
            </div>
            <div className="bg-gray-50 dark:bg-monday-dark-bg p-5 rounded-xl border border-gray-100 dark:border-monday-dark-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                  <Clock size={20} weight="fill" />
                </div>
                <span className="font-medium text-gray-600 dark:text-gray-300">{t('avg_response_time')}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white pl-11">2.5h</h3>
            </div>
            <div className="bg-gray-50 dark:bg-monday-dark-bg p-5 rounded-xl border border-gray-100 dark:border-monday-dark-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                  <Star size={20} weight="fill" />
                </div>
                <span className="font-medium text-gray-600 dark:text-gray-300">{t('performance_score')}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white pl-11">98%</h3>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-monday-dark-border mb-6">
            <div className="flex gap-8">
              {['Overview', 'Performance', 'Activity'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase() as 'overview' | 'performance' | 'activity')}
                  className={`pb-3 font-medium text-sm transition-colors relative ${
                    activeTab === tab.toLowerCase()
                      ? 'text-monday-blue dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {tab === 'Overview'
                    ? t('overview_tab')
                    : tab === 'Performance'
                      ? t('performance_tab')
                      : t('activity_tab')}
                  {activeTab === tab.toLowerCase() && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-monday-blue rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Placeholders */}
          <div className="animate-fade-in">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('about_section')}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {member.role === TeamRole.ADMIN
                      ? `${member.name} is an Administrator overseeing the ${member.department} department. Responsible for strategic planning and team coordination.`
                      : `${member.name} is a key member of the ${member.department} team, contributing to project success and daily operations.`}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('current_projects')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-gray-100 dark:border-monday-dark-border hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {t('q3_marketing_campaign')}
                          </span>
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            {t('on_track')}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                          <div className="bg-monday-blue h-1.5 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{t('due_in_days').replace('{days}', '5')}</span>
                          <span>75%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'performance' && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Star size={32} className="text-gray-300" />
                </div>
                <p>{t('performance_coming_soon')}</p>
              </div>
            )}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-monday-blue flex-shrink-0 mt-1">
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white text-sm">
                        <span className="font-semibold">{t('completed_task')}</span> "Update Q3 Report"
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{t('hours_ago').replace('{count}', '2')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
