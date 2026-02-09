import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

export interface AdminAuthResult {
  authorized: boolean;
  user?: {
    id: string;
    email?: string;
  };
  error?: {
    status: number;
    message: string;
  };
}

/**
 * Validates that the request is from an authenticated admin user.
 * 
 * @param req - The incoming request object
 * @returns AdminAuthResult with authorization status
 * 
 * Usage:
 * ```typescript
 * const auth = await validateAdminAuth(req);
 * if (!auth.authorized) {
 *   return new Response(
 *     JSON.stringify({ error: auth.error!.message }),
 *     { status: auth.error!.status, headers: corsHeaders }
 *   );
 * }
 * // Proceed with admin-only logic using auth.user
 * ```
 */
export async function validateAdminAuth(req: Request): Promise<AdminAuthResult> {
  try {
    // 1. Check for Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return {
        authorized: false,
        error: {
          status: 401,
          message: 'Missing authorization header'
        }
      };
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return {
        authorized: false,
        error: {
          status: 500,
          message: 'Server configuration error'
        }
      };
    }

    // 2. Create client with user's auth token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // 3. Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return {
        authorized: false,
        error: {
          status: 401,
          message: 'Unauthorized'
        }
      };
    }

    // 4. Verify admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error('Role check failed:', roleError.message);
      return {
        authorized: false,
        error: {
          status: 500,
          message: 'Role verification failed'
        }
      };
    }

    if (!roleData) {
      console.warn(`Access denied for user ${user.email} (not admin)`);
      return {
        authorized: false,
        error: {
          status: 403,
          message: 'Admin access required'
        }
      };
    }

    // Success - user is authenticated and has admin role
    return {
      authorized: true,
      user: {
        id: user.id,
        email: user.email
      }
    };

  } catch (error) {
    console.error('Unexpected error in admin auth validation:', error);
    return {
      authorized: false,
      error: {
        status: 500,
        message: 'Internal server error'
      }
    };
  }
}
