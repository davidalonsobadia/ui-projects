import { NextResponse } from "next/server"
import { API_BASE_URL } from "@/config/api"

interface LoginRequest {
  email: string
  password: string
}

interface ApiLoginRequest {
  username: string
  password: string
}

export async function POST(request: Request) {
  try {
    const body: LoginRequest = await request.json()

    const apiRequestBody: ApiLoginRequest = {
      username: body.email,
      password: body.password,
    }

    const apiResponse = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiRequestBody),
    })

    if (!apiResponse.ok) {
      const error = await apiResponse.json()
      return NextResponse.json(
        { error: error.message || "Invalid Credentials" },
        { status: apiResponse.status }
      )
    }

    const data = await apiResponse.json()
    const response = NextResponse.json({
      user: {
        email: body.email,
      },
      token: data.access_token,
    })

    response.cookies.set({
      name: "auth-token",
      value: data.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
