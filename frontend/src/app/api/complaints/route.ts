import { NextResponse } from 'next/server';
import { mockTickets, addMockTicket, updateMockTicketStatus } from '../data';
import { cookies } from 'next/headers';

// Get all tickets
export async function GET() {
  const cookieStore = await cookies();
  const role = cookieStore.get('auth_role')?.value;

  if (!role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // A real app would filter by user ID. For our prototype, we return all or subset based on role.
  // We'll just return all for simplicity in the prototype.
  return NextResponse.json(mockTickets);
}

// Create a new ticket
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const role = cookieStore.get('auth_role')?.value;

  if (!role || role !== 'Student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  
  // Dummy AI prediction
  let ai_category = "General";
  let ai_priority = "Normal";
  
  const text = `${data.title} ${data.description}`.toLowerCase();
  if (text.includes('water') || text.includes('pipe') || text.includes('leak')) {
    ai_category = "Plumbing";
    ai_priority = text.includes('flood') ? "Critical" : "High";
  } else if (text.includes('ac') || text.includes('air conditioner') || text.includes('wire')) {
    ai_category = "Electrical";
    ai_priority = "High";
  } else if (text.includes('window') || text.includes('door') || text.includes('wood')) {
    ai_category = "Carpentry";
  }

  const newTicket = addMockTicket({
    title: data.title,
    description: data.description,
    location: data.location,
    ai_category,
    ai_priority
  });

  return NextResponse.json(newTicket, { status: 201 });
}

// Update ticket status
export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const role = cookieStore.get('auth_role')?.value;

  if (!role || role === 'Student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, status } = await request.json();
  const updated = updateMockTicketStatus(id, status);

  if (updated) {
    return NextResponse.json(updated);
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
