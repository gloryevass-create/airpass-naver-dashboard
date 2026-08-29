export const googleCalendarClientId = process.env.GOOGLE_CALENDAR_CLIENT_ID ?? "";
export const googleCalendarClientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ?? "";

export const isGoogleCalendarConfigured = Boolean(googleCalendarClientId && googleCalendarClientSecret);
