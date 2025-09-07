import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// List of public/auth routes that do NOT require authentication
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const PUBLIC_ROUTES = ["/api/uploadthing", "/room"];

export function middleware(request: NextRequest) {
	const { pathname, search } = request.nextUrl;
	const session = request.cookies.get("__session")?.value;

	// Allow public routes for everyone
	if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
		return NextResponse.next();
	}

	// If user is logged in and visits an auth route, redirect them away
	if (session && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
		// Use redirect param if present, else default to home
		const redirectParam = request.nextUrl.searchParams.get("redirect") || "/";
		return NextResponse.redirect(new URL(redirectParam, request.url));
	}

	// Allow public/auth routes for unauthenticated users
	if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
		return NextResponse.next();
	}

	// If not authenticated, redirect to login with redirect param
	if (!session) {
		const redirectTo = pathname + (search ? search : "");
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("redirect", redirectTo);
		return NextResponse.redirect(loginUrl);
	}

	// Authenticated, allow
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next|api|static|favicon.ico).*)"],
};
