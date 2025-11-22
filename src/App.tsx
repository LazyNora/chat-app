import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Auth } from "@/pages/Auth";
import { Home } from "@/pages/Home";
import { GroupPage } from "@/pages/GroupPage";
import { InvitePage } from "@/pages/InvitePage";
import { UserSettings } from "@/components/settings/UserSettings";
import { MessagesPage } from "@/pages/MessagesPage";

function App() {
	return (
		<AuthProvider>
			<Routes>
				<Route path="/auth" element={<Auth />} />
				<Route path="/" element={<Home />} />
				<Route path="/groups/:groupId" element={<GroupPage />} />
				<Route path="/invite/:code" element={<InvitePage />} />
				<Route path="/settings" element={<UserSettings />} />
				<Route path="/friends" element={<Navigate to="/messages" replace />} />
				<Route path="/messages" element={<MessagesPage />} />
				<Route path="/messages/:conversationId" element={<MessagesPage />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</AuthProvider>
	);
}

export default App;
