# Security Specification - SocialPulse AI

## Data Invariants
- A Post/Account/Engagement/AutomationRule must be owned by the authenticated user (`userId` match).
- Users can only read/write their own data.
- Timestamps (`createdAt`, `updatedAt`) must be set by the server where possible or validated.
- `status` fields must be within the defined enum sets.

## The Dirty Dozen (Potential Attack Payloads)
1. **Identity Spoofing**: Attempt to create an account with someone else's UID.
2. **Post Hijacking**: Updating a post document ID that doesn't belong to the requester.
3. **Ghost Post**: Adding a post with a hidden 1MB metadata field to exhaust storage.
4. **Platform Forgery**: Setting a platform to a non-existent service like "evil-service".
5. **Token Theft**: Reading another user's `encryptedAccessToken`.
6. **Automation Injection**: Adding a malicious script in `responseTemplate`. (Rules should limit string length).
7. **Engagement Scraping**: Attempting to list all engagements without a `userId` filter.
8. **Status Bypass**: Changing a post status from `published` back to `draft` for re-execution (if logic depends on it).
9. **Bulk Rule Creation**: Creating 10,000 automation rules to hit quotas.
10. **ID Poisoning**: Using a 1.5KB string as a document ID for a new post.
11. **Negative Scheduling**: Scheduling a post for the past (e.g., year 1990).
12. **Impersonation Action**: Attempting to delete someone else's Linked Account.

## Test Runner (Draft)
The `firestore.rules.test.ts` will verify these scenarios return `PERMISSION_DENIED`.
