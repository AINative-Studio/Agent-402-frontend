import { useState } from 'react';
import { Bot, Edit2, Trash2, Eye, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { AgentRoleBadge } from './AgentRoleBadge';
import { AgentScopeBadge } from './AgentScopeBadge';
import { AgentReputation } from './AgentReputation';
import type { Agent } from '../lib/types';

interface AgentCardProps {
  agent: Agent;
  onEdit?: (agent: Agent) => void;
  onDelete?: (agentId: string) => void;
  onViewDetails?: (agentId: string) => void;
  /** Optional agent token ID for blockchain reputation display */
  agentTokenId?: number;
  /** Show blockchain reputation (requires agentTokenId) */
  showReputation?: boolean;
}

function truncateDID(did: string): string {
  if (did.length <= 20) return did;
  const parts = did.split(':');
  if (parts.length >= 3 && parts[2].length > 12) {
    const address = parts[2];
    const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
    parts[2] = truncated;
    return parts.join(':');
  }
  return `${did.slice(0, 20)}...${did.slice(-4)}`;
}

export function AgentCard({
  agent,
  onEdit,
  onDelete,
  onViewDetails,
  agentTokenId,
  showReputation = false,
}: AgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const statusColors = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    suspended: 'bg-red-500',
  };

  const shouldTruncateDescription = agent.description && agent.description.length > 100;
  const displayDescription = isExpanded || !shouldTruncateDescription
    ? agent.description
    : `${(agent.description ?? '').slice(0, 100)}...`;

  return (
    <div
      className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all cursor-pointer group"
      onClick={() => onViewDetails?.(agent.agent_id)}
    >
      <div className="p-4 space-y-3">
        {/* Header with status indicator */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="flex flex-col">
              <h3 className="text-white font-semibold text-base">{agent.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
                <span className="text-xs text-gray-400 capitalize">{agent.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <AgentRoleBadge role={agent.role} />
          {agent.scope && <AgentScopeBadge scope={agent.scope} />}
        </div>

        {/* DID with Tooltip */}
        <div className="relative">
          <div
            className="text-xs font-mono text-gray-400 cursor-help"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => e.stopPropagation()}
          >
            DID: {truncateDID(agent.did)}
          </div>
          {showTooltip && (
            <div className="absolute z-10 bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg text-xs font-mono text-gray-300 whitespace-nowrap">
              {agent.did}
            </div>
          )}
        </div>

        {/* Description */}
        {agent.description && (
          <div className="text-sm text-gray-300">
            <p>{displayDescription}</p>
            {shouldTruncateDescription && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-blue-400 hover:text-blue-300 text-xs mt-1 flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Show more
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Created Date */}
        <div className="text-xs text-gray-500">
          Created: {new Date(agent.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>

        {/* Blockchain Reputation (optional) */}
        {showReputation && agentTokenId !== undefined && (
          <div className="pt-2 border-t border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
              <Star className="w-3 h-3 text-yellow-400" />
              <span>On-chain Reputation</span>
            </div>
            <AgentReputation agentTokenId={agentTokenId} compact />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.(agent.agent_id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(agent);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-md transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(agent.agent_id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-sm rounded-md transition-colors border border-red-500/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
