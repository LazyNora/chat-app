import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Auth } from "@/pages/Auth";
import { Home } from "@/pages/Home";
import { useAuthStore } from "@/stores/authStore";

function App() {
	return (
		<AuthProvider>
			<Routes>
				<Route path="/auth" element={<Auth />} />
				<Route path="/" element={<Home />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</AuthProvider>
	);
}

export default App;
