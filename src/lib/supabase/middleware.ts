import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Create a Supabase client for the middleware
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )

                    supabaseResponse = NextResponse.next({
                        request,
                    })

                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: You *must* call getUser() in the middleware!
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname;

    // Protected Routes: Everything under /app
    const isProtected = path.startsWith('/app');

    // Auth Routes: Login, Register
    const isAuthRoute = path.startsWith('/auth');

    // 1. If trying to access protected route and NOT logged in -> Redirect to Login
    if (!user && isProtected) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
    }

    // 2. If logged in and trying to access Login/Register -> Redirect to Dashboard
    if (user && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/app'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
