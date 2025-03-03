export interface NotificationPreferences {
  coordinates_notification: boolean
  frequency: number
  proofs_notification: boolean
}

export interface OnboardingData {
  current_country: string
  days_in_current_country: number
  days_in_target_country: number
  minimum_days_in_current_country: number
  minimum_days_in_target_country: number
  notifications_frequency: number | null
  onboarding_done: boolean
  proofList: string[]
  target_country: string
}

export interface User {
  email: string
  id: string
  last_seen: string | null
  membership_status: "free" | "premium"
  name: string
  notification_preferences: NotificationPreferences
  onboarding_data: OnboardingData
  provider: "email_and_password" | "google" | "apple"
  referrer_id: string | null
  registration_date: string
  used_campaign_codes: string[]
}