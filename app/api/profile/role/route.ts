import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * GET /api/profile/role
 * Returns the current user's role (bypasses RLS)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ role: null }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    return NextResponse.json({ role: profile?.role || null });
  } catch {
    return NextResponse.json({ role: null }, { status: 500 });
  }
}

/**
 * POST /api/profile/role
 * Updates the user's role in their profile
 * Uses service role key to bypass RLS
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !['curator', 'employee'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "curator" or "employee"' },
        { status: 400 }
      );
    }

    // Create Supabase client with user session to get current user
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = getAdminClient();

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    let result;
    
    if (existingProfile) {
      // Profile exists - update it
      result = await supabaseAdmin
        .from('profiles')
        .update({ role })
        .eq('id', user.id)
        .select()
        .single();
    } else {
      // Profile doesn't exist - create it
      result = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || null,
          full_name: user.user_metadata?.full_name || null,
          role: role,
          org_id: null,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Profile save error:', {
        message: result.error.message,
        details: result.error.details,
        hint: result.error.hint,
        code: result.error.code,
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to save role',
          details: result.error.message,
          code: result.error.code,
        },
        { status: 500 }
      );
    }

    console.log('Profile updated successfully:', { userId: user.id, role });

    return NextResponse.json({
      ok: true,
      profile: result.data,
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/profile/role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
