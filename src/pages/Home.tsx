import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { GroupList } from '@/components/groups/GroupList';
import { useGroupStore } from '@/stores/groupStore';
import { Button } from '@/components/ui/button';
import { signOut } from '@/services/auth';
import { toast } from 'sonner';
import { LogOut, Settings, Plus } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { useState } from 'react';

export function Home() {
  const { user } = useAuthStore();
  const { groups, selectedGroupId } = useGroupStore();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (selectedGroupId) {
      navigate(`/groups/${selectedGroupId}`);
    }
  }, [selectedGroupId, navigate]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
    }
  };

  return (
    <>
      <div className="h-screen flex bg-background">
        <GroupList />

        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <div className="h-12 border-b flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">Discord Clone</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-hidden flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md">
              <h2 className="text-3xl font-semibold">Welcome to Discord Clone!</h2>
              <p className="text-muted-foreground text-lg">
                {groups.length === 0
                  ? 'Create your first group to get started'
                  : 'Select a group from the sidebar or create a new one'}
              </p>
              <Button onClick={() => setShowCreateModal(true)} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Group
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CreateGroupModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}

