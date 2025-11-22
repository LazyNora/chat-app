import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function FriendsPage() {
	// Redirect to messages page with friends tab
	return <Navigate to="/messages" replace />;
}
