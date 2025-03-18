import { NextResponse, NextRequest } from "next/server"
import { API_BASE_URL } from "@/config/api"
import { apiFetch } from "@/lib/api"

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const response = await apiFetch(`${API_BASE_URL}/admin/proofs`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const proofs = await response.json()
    return NextResponse.json(proofs)
  } catch (error) {
    console.error('Error fetching proofs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proofs' },
      { status: 500 }
    )
  }
}
