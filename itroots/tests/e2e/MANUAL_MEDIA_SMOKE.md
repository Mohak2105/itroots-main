# Jitsi Manual Media Smoke

Run this after the Playwright suite passes on the HTTPS staging environment.

## Preconditions

- Open the LMS with the same `E2E_BASE_URL` origin over `https://`.
- Use a real browser profile, not fake-device automation.
- Make sure the browser site settings for the LMS origin allow `Camera` and `Microphone`.

## Teacher and Student Pass

1. Log in as `Faculty@itroots.com / Faculty123` and `student@itroots.com / student123` in two separate browser sessions.
2. Create a Jitsi live class scheduled for the current time from the teacher calendar.
3. Open the teacher live-class room page and verify the embedded Jitsi room loads.
4. Allow camera and microphone when the browser prompts.
5. Open the student live-class room page and verify the same embedded Jitsi room loads.
6. Allow camera and microphone for the student browser session too.
7. Confirm both teacher and student can see the live room and use real microphone/camera controls inside Jitsi.

## Permission Checks

- Browser site settings show `Camera: Allow` for the LMS origin.
- Browser site settings show `Microphone: Allow` for the LMS origin.
- The room no longer shows a `Permission not granted` warning for either participant.

## Closeout

1. End the live class from the teacher page.
2. Refresh the student room page.
3. Confirm the student sees the completed-state block and can no longer rejoin.
