# Trusted Guardian Tracking and Authorization Policy

## 1. Invitation & Verification Flow
To protect women from unauthorized tracking, guardians can only connect via a double-opt-in process:
* **Invitation Code:** The woman user generates a unique, 6-character connection code inside her "Trusted Contacts" page.
* **Binding Action:** The guardian must log in to their console and enter this exact code to establish the link.
* **Opt-In Check:** The connection remains pending and inactive until the woman validates and configures the permission levels.

## 2. Dynamic Permission Tiers
Unlike traditional tracking apps that share location constantly, CausalGuard supports custom access levels:
* **No Access:** The guardian cannot see active coordinates, journeys, or statuses.
* **SOS-Only (Default):** Guardian can track location *only* during an active SOS incident or check-in warning.
* **Journey-Only:** Location access is active only when the woman starts a safe commute, and ends automatically on commute completion.
* **Temporary (30-Min):** A short-term window for late-night transit tracking, expiring automatically.
* **Always-On:** Continuous access, reserved for immediate family members.
