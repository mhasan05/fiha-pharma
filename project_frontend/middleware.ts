import { NextResponse } from "next/server";
import { getCurrentUser } from "./service/authService";

export async function middleware(request: Request) {
  // Fetch current user (authentication token)
  const token = await getCurrentUser();

  // If there's no token, redirect to login page
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // If user is authenticated, proceed with the request
  return NextResponse.next();
}

// Define which paths the middleware applies to
export const config = {
  matcher: ['/', "/products", "/products/:page","/orders","/notice",'/notice/:page', '/user','/area', '/area/:page', '/category','/category/:page', '/company','/company/:page','/settings' ],
};
