import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, MessageSquare } from 'lucide-react';
import { useGroupStore } from '@/stores/groupStore';
import { useAuthStore } from '@/stores/authStore';
import { getUserGroups } from '@/services/groups';
import { CreateGroupModal } from './CreateGroupModal';
import { UserProfile } from '@/components/user/UserProfile';
import { cn } from '@/lib/utils';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';

export function GroupList() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { groups, selectedGroupId, setSelectedGroup, setGroups } = useGroupStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Load groups when user is available
  useEffect(() => {
    if (user) {
      getUserGroups(user.uid).then(setGroups).catch(console.error);
    }
  }, [user, setGroups]);

  const isDMPage = location.pathname.startsWith('/messages') || location.pathname.startsWith('/friends');

  return (
    <>
      <div className="w-16 bg-muted flex flex-col items-center gap-2 py-2">
        {/* DM/Friends Selection */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate('/messages')}
                className={cn(
                  'relative w-12 h-12 rounded-full overflow-hidden hover:rounded-2xl transition-all flex items-center justify-center',
                  isDMPage && 'rounded-2xl bg-primary'
                )}
              >
                <MessageSquare className={cn('h-6 w-6', isDMPage ? 'text-primary-foreground' : 'text-muted-foreground')} />
                {isDMPage && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-foreground rounded-r" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Direct Messages</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="w-8 h-px bg-border my-1" />

        <TooltipProvider>
          {groups.map((group) => (
            <ContextMenu key={group.id}>
              <ContextMenuTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        setSelectedGroup(group.id);
                        navigate(`/groups/${group.id}`);
                      }}
                      className={cn(
                        'relative w-12 h-12 rounded-full overflow-hidden hover:rounded-2xl transition-all',
                        selectedGroupId === group.id && 'rounded-2xl'
                      )}
                    >
                      {group.iconURL ? (
                        <img src={group.iconURL} alt={group.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center">
                          <span className="text-primary-foreground font-semibold">
                            {group.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {selectedGroupId === group.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-foreground rounded-r" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{group.name}</p>
                  </TooltipContent>
                </Tooltip>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() => {
                    setSelectedGroup(group.id);
                    navigate(`/groups/${group.id}`);
                  }}
                >
                  Open {group.name}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem className="text-destructive">
                  Leave Group
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </TooltipProvider>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-12 h-12 rounded-full bg-background hover:bg-accent hover:rounded-2xl transition-all flex items-center justify-center"
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* User Profile at bottom */}
        <div className="mt-auto w-full">
          <UserProfile />
        </div>
      </div>

      <CreateGroupModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}

