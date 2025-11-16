import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { GroupList } from '@/components/groups/GroupList';
import { GroupSidebar } from '@/components/groups/GroupSidebar';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { useGroupStore } from '@/stores/groupStore';
import { Button } from '@/components/ui/button';
import { signOut } from '@/services/auth';
import toast from 'react-hot-toast';
import { LogOut, Settings } from 'lucide-react';

export function Home() {
  const { user } = useAuthStore();
  const { selectedGroupId, selectedChannelId } = useGroupStore();

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
    <div className="h-screen flex bg-background">
      <GroupList />
      <GroupSidebar />

      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="h-12 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {selectedChannelId ? (
              <span className="font-medium">Channel Selected</span>
            ) : (
              <span className="text-muted-foreground">Select a channel</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedChannelId && selectedGroupId ? (
            <>
              <MessageList groupId={selectedGroupId} channelId={selectedChannelId} />
              <MessageInput groupId={selectedGroupId} channelId={selectedChannelId} />
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <h2 className="text-2xl font-semibold">Welcome to Discord Clone!</h2>
                <p className="text-muted-foreground">
                  {selectedGroupId
                    ? 'Select a channel from the sidebar to start chatting'
                    : 'Create a new group or select an existing one to get started'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

