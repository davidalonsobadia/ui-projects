import { NextResponse } from "next/server"

const MOCK_PROOFS = [
  {
    id: "1",
    user: "John Doe",
    type: "Identity Document",
    status: "Verified",
    date: "2024-02-18",
    details: "Passport verification",
  },
  {
    id: "2",
    user: "Jane Smith",
    type: "Address Proof",
    status: "Pending",
    date: "2024-02-17",
    details: "Utility bill verification",
  },
  {
    id: "3",
    user: "Bob Wilson",
    type: "Identity Document",
    status: "Rejected",
    date: "2024-02-16",
    details: "Driver's license verification",
  },
  {
    id: "4",
    user: "Alice Brown",
    type: "Address Proof",
    status: "Verified",
    date: "2024-02-15",
    details: "Bank statement verification",
  },
  {
    id: "5",
    user: "Charlie Davis",
    type: "Identity Document",
    status: "Pending",
    date: "2024-02-14",
    details: "National ID verification",
  },
]

export async function GET() {
  // In production, you would:
  // 1. Validate the JWT token
  // 2. Query your database
  // 3. Apply pagination and filtering
  // Example:
  // const proofs = await prisma.proofs.findMany({
  //   include: { user: true },
  //   take: 10,
  //   skip: page * 10,
  //   where: {
  //     status: status || undefined
  //   }
  // })

  return NextResponse.json(MOCK_PROOFS)
}

