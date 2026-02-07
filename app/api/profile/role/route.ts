import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/profile/role
 * Updates the user's role in their profile
 * Creates profile if it doesn't exist (upsert)
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

    // Create Supabase client with user session
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

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    let result;
    
    if (existingProfile) {
      // Profile exists - update it
      const { data, error } = await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
        .update({ role })
        .eq('id', user.id)
        .select()
        .single();
      result = { data, error };
    } else {
      // Profile doesn't exist - create it
      const { data, error } = await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
        .insert({
          id: user.id,
          email: user.email || null,
          full_name: user.user_metadata?.full_name || null,
          role: role,
          org_id: null,
        })
        .select()
        .single();
      result = { data, error };
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
