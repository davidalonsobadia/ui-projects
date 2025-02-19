import { NextResponse } from "next/server"

const MOCK_STATISTICS = {
  userTypes: {
    freemium: 2853,
    premium: 947,
    totalUsers: 3800,
    conversionRate: "24.9%",
  },
  recentActivity: {
    newUsersToday: 45,
    newUsersThisWeek: 320,
    newUsersThisMonth: 1250,
  },
  topCountries: [
    { country: "United States", users: 1200, percentage: "31.6%" },
    { country: "United Kingdom", users: 580, percentage: "15.3%" },
    { country: "Germany", users: 420, percentage: "11.1%" },
    { country: "France", users: 380, percentage: "10.0%" },
    { country: "Spain", users: 340, percentage: "8.9%" },
  ],
  userGrowth: [
    { month: "Jan", freemium: 2100, premium: 700 },
    { month: "Feb", freemium: 2300, premium: 780 },
    { month: "Mar", freemium: 2500, premium: 850 },
    { month: "Apr", freemium: 2650, premium: 890 },
    { month: "May", freemium: 2750, premium: 920 },
    { month: "Jun", freemium: 2853, premium: 947 },
  ],
  onboardingSuccess: {
    completed: 3420,
    inProgress: 280,
    stalled: 100,
    completionRate: "90%",
  },
}

export async function GET() {
  return NextResponse.json(MOCK_STATISTICS)
}

