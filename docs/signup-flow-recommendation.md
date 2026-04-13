# MVP sign-up flow recommendation

## Recommendation

For the MVP, use a **sign-up request + admin approval + Microsoft Entra guest invitation** flow in the existing Entra tenant.

Do **not** introduce Azure AD B2C / Entra External ID yet unless the product requires true self-service username/password accounts from day one.

## Recommended flow

1. A user completes and submits an **access request** form.
2. The request is stored in the backend with a status such as `Pending`.
3. The user receives a **confirmation email** confirming the request was received.
4. An admin or reviewer is notified to approve or reject the request.
5. When approved, the backend creates a **Microsoft Entra guest invitation** using Microsoft Graph.
6. The invited user is assigned the correct **Learner** app role or group membership.
7. Microsoft sends the **invitation email**.
8. The user clicks the invitation link and signs in using their existing identity.
9. After first sign-in, the app shows an **onboarding/profile completion** screen for any extra details the LMS needs.

## Why this is the right MVP choice

- It matches the repo's current **Entra ID + MSAL + app roles** architecture.
- It avoids building custom password creation, reset, and credential management.
- It is faster to deliver and simpler to operate.
- It keeps authentication in Microsoft Entra while the LMS focuses on profile and access data.

## Important caveat

With an **Entra guest invitation** flow, the application does **not** provide its own "set password" page.

Password or sign-in setup is handled by Microsoft, depending on the invited user's identity method. If true self-service email/password registration is needed later, the correct future direction is **Entra External ID / customer identity**, not guest invitations.

## Suggested MVP data split

- **Identity/authentication:** Microsoft Entra account
- **Application profile:** LMS user/profile record in the app database
- **Access control:** Entra app roles or groups
- **Request tracking:** LMS `SignupRequests` or similar backend record

## Summary

The recommended MVP journey is:

**Request access -> admin approval -> Entra guest invitation -> first sign-in -> complete profile in the app**
