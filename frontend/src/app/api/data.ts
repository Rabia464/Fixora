export interface Ticket {
  id: number;
  title: string;
  description: string;
  location: string;
  status: string;
  ai_category: string | null;
  ai_priority: string | null;
  created_at: string;
}

// In-memory store (will reset when Next.js dev server restarts, but persists across client navigations)
export let mockTickets: Ticket[] = [
  {
    id: 1,
    title: "Leaking Pipe in Washroom",
    description: "The sink pipe in the 3rd floor washroom is leaking heavily.",
    location: "Hostel B, Floor 3",
    status: "Pending",
    ai_category: "Plumbing",
    ai_priority: "Critical",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: "Broken Window",
    description: "A window pane is shattered in the common room.",
    location: "Hostel C, Common Room",
    status: "In Progress",
    ai_category: "Carpentry",
    ai_priority: "High",
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export const addMockTicket = (ticket: Omit<Ticket, "id" | "status" | "created_at">) => {
  const newTicket = {
    ...ticket,
    id: mockTickets.length > 0 ? Math.max(...mockTickets.map(t => t.id)) + 1 : 1,
    status: "Pending",
    created_at: new Date().toISOString()
  };
  mockTickets.push(newTicket);
  return newTicket;
};

export const updateMockTicketStatus = (id: number, status: string) => {
  const ticket = mockTickets.find(t => t.id === id);
  if (ticket) {
    ticket.status = status;
    return ticket;
  }
  return null;
};
