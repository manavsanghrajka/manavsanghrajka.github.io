import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user is an admin
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (adminUser) {
          // User is an admin, redirect to admin dashboard
          return NextResponse.redirect(`${origin}/admin`)
        }
      }
      
      // User is not an admin - sign them out and redirect with error
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/admin-login?error=not_admin`)
    }
  }

  // Return the user to admin login with an error
  return NextResponse.redirect(`${origin}/admin-login?error=auth_error`)
}
