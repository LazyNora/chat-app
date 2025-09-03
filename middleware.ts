import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// List of public/auth routes that do NOT require authentication
const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password"];

export function middleware(request: NextRequest) {
	const { pathname, search } = request.nextUrl;
	const session = request.cookies.get("__session")?.value;

	// If user is logged in and visits an auth route, redirect them away
	if (session && PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
		// Use redirect param if present, else default to home
		const redirectParam = request.nextUrl.searchParams.get("redirect") || "/";
		return NextResponse.redirect(new URL(redirectParam, request.url));
	}

	// Allow public/auth routes for unauthenticated users
	if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
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
