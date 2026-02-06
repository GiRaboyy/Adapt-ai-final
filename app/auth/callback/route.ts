/**
 * OAuth callback handler
 * Exchanges authorization code for session and redirects based on profile state
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=${encodeURIComponent(error_description || 'Authentication failed')}`
    );
  }

  // Handle missing code
  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/auth?error=missing_code`);
  }

  const supabase = await createClient();

  try {
    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth?error=${encodeURIComponent('Authentication failed. Please try again.')}`
      );
    }

    const user = data.user;

    if (!user) {
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=no_user`);
    }

    // Check if profile exists and has role
    // Use any type to work around Supabase type inference issues
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const profile = profileData as { role: string } | null;

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=profile_error`);
    }

    // If profile doesn't exist, create it defensively (trigger might have failed)
    if (!profile) {
      // @ts-expect-error - Supabase type inference issue with insert
      const { error: insertError } = await supabase.from('profiles').insert([{
        id: user.id,
        email: user.email || null,
        full_name: user.user_metadata?.full_name || null,
        role: (user.user_metadata?.role || 'curator') as 'curator' | 'employee',
        org_id: null,
      }]);

      if (insertError) {
        console.error('Profile creation error:', insertError);
        return NextResponse.redirect(`${requestUrl.origin}/auth?error=profile_creation_failed`);
      }

      // If role was provided, go to dashboard; otherwise onboarding
      if (user.user_metadata?.role) {
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
      } else {
        return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
      }
    }

    // Check if profile has a role
    if (!profile.role) {
      return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
    }

    // All good - redirect to dashboard
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);

  } catch (err) {
    console.error('Unexpected callback error:', err);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=${encodeURIComponent('An unexpected error occurred')}`
    );
  }
}
