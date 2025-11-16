import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGroupStore } from '@/stores/groupStore';
import { CreateGroupModal } from './CreateGroupModal';
import { cn } from '@/lib/utils';

export function GroupList() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { groups, selectedGroupId, setSelectedGroup } = useGroupStore();

  return (
    <>
      <div className="w-16 bg-muted flex flex-col items-center gap-2 py-2">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setSelectedGroup(group.id)}
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
        ))}

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-12 h-12 rounded-full bg-background hover:bg-accent hover:rounded-2xl transition-all flex items-center justify-center"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <CreateGroupModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}

