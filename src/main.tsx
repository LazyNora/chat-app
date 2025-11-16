import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<App />
			<Toaster
				position="top-right"
				toastOptions={{
					className: "",
					style: {
						background: "hsl(var(--background))",
						color: "hsl(var(--foreground))",
						border: "1px solid hsl(var(--border))",
					},
				}}
			/>
		</BrowserRouter>
	</StrictMode>
);
