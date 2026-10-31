# Security Specification: Math Arena

## 1. Data Invariants
- `users`:
  - Each learner profile document ID matches their unique generated identifier.
  - Required fields: `nickname` (2~20 chars), `password` (4~64 chars), `createdAt`.
  - User can read and write user document for self-registration and nickname verification.
- `hallOfFame`:
  - Public leaderboard entries for high scorers in classroom math battles.
  - Read: Public read is permitted so all learners can celebrate on the Hall of Fame podium.
  - Create: Must validate all required fields (`id`, `nickname`, `score`, `accuracy`, `mode`, `grade`, `durationSeconds`, `createdAt`).
  - Update / Delete: Disallowed by client to preserve immutable historical scores.

## 2. Dirty Dozen Payloads
1. Injecting 500KB string into `nickname` -> Denied by `size() <= 20`.
2. Negative score in `hallOfFame` -> Denied by `score >= 0`.
3. Updating an existing `hallOfFame` score record to tamper with ranking -> Denied by `allow update: if false`.
4. Deleting another student's high score record -> Denied by `allow delete: if false`.
5. Missing `password` field during user creation -> Denied by `hasAll(['nickname', 'password', 'createdAt'])`.
6. Injecting extra ghost fields into user document -> Denied by `hasOnly(['nickname', 'password', 'createdAt'])`.
7. Invalid game mode (e.g. `mode: 'hacked'`) -> Denied by enum validation.
8. Non-numeric score field in `hallOfFame` -> Denied by `is number`.
9. Out of bounds accuracy (> 100 or < 0) -> Denied by `accuracy >= 0 && accuracy <= 100`.
10. Attempting to delete `users` collection -> Denied by `allow delete: if false`.
11. Document ID poisoning with junk symbols -> Denied by `isValidId(docId)`.
12. Empty nickname -> Denied by `size() >= 1`.
