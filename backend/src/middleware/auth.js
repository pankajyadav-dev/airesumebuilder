
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function getServerAuthSession(request) {
  try {
    let token = null;
    
    // If request has Authorization header, try to get token from there first
    if (request && request.headers) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('Token found in Authorization header:', token.substring(0, 10) + '...');
      }
    }
    
    // If no token in Authorization header, try to get from cookies
    if (!token) {
      // Use cookies() in a way that doesn't trigger the warning
      const cookieStore = cookies();
      const tokenCookie = cookieStore.get('token');
      token = tokenCookie?.value;
      
      if (token) {
        console.log('Token found in cookies:', token.substring(0, 10) + '...');
      } else {
        console.log('No token found in cookies or Authorization header');
        return null;
      }
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Token verified successfully, user ID:', decoded.userId);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

export async function authMiddleware(request) {
  const session = await getServerAuthSession(request);
  
  if (!session) {
    console.log('Authentication failed - no valid session');
    return new Response(JSON.stringify({ 
      success: false,
      authenticated: false,
      message: 'Unauthorized' 
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  
  // Attach user info to the request
  request.user = session;
  return null;
}

export function withAuth(handler) {
  return async function(request, ...args) {
    const authResult = await authMiddleware(request);
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    return handler(request, ...args);
  };
}
