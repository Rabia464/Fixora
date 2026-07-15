import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Determine role based on email pattern
    let role = 'Student';
    if (email.includes('supervisor')) {
      role = 'Hostel Supervisor';
    } else if (email.includes('maintenance')) {
      role = 'Maintenance Office';
    }

    // Create response and set HTTP-only cookie
    const response = NextResponse.json({ success: true, role });
    
    response.cookies.set({
      name: 'auth_role',
      value: role,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
