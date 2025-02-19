import { NextResponse } from "next/server"

const MOCK_USERS = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    type: "Premium",
    country: "United States",
    onboardedAt: "2024-01-15",
    status: "Active",
  },
  {
    id: "2",
    name: "Maria Garcia",
    email: "maria@example.com",
    type: "Freemium",
    country: "Spain",
    onboardedAt: "2024-02-01",
    status: "Active",
  },
  {
    id: "3",
    name: "Hans Schmidt",
    email: "hans@example.com",
    type: "Premium",
    country: "Germany",
    onboardedAt: "2024-01-20",
    status: "Active",
  },
  {
    id: "4",
    name: "Sophie Martin",
    email: "sophie@example.com",
    type: "Freemium",
    country: "France",
    onboardedAt: "2024-02-10",
    status: "Active",
  },
  {
    id: "5",
    name: "Luigi Romano",
    email: "luigi@example.com",
    type: "Premium",
    country: "Italy",
    onboardedAt: "2024-02-15",
    status: "Active",
  },
]

export async function GET() {
  return NextResponse.json(MOCK_USERS)
}

