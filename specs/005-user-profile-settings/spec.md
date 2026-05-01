# Feature Specification: User Profile & Settings

**Feature Branch**: `005-user-profile-settings`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "Implémenter toute la logique du profil utilisateur et des paramètres de ByteBattle2. Connecter le frontend existant et modifier si nécessaire."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload and Manage Profile Photo (Priority: P1)

A registered user wants to personalize their account by uploading a profile photo. They navigate to the Settings page, click "Change Photo", select an image file from their device, see a preview of the cropped image, and confirm the upload. The photo is resized and stored on the server. If the user has not uploaded a photo, the existing DiceBear avatar is displayed as a fallback. The updated photo appears immediately across all areas of the platform: navbar, forum posts, comments, leaderboard, and profile page.

**Why this priority**: Profile photo is the most visible personalization feature and directly impacts user identity across the entire platform. It touches every component that displays a user.

**Independent Test**: Can be fully tested by uploading an image on the settings page and verifying it appears in the navbar avatar, a forum post author avatar, and the profile page header.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the Settings page, **When** they click "Change Photo" and select a valid JPG/PNG/WebP image under 5MB, **Then** a circular preview of the image is displayed before confirmation.
2. **Given** a user has previewed a valid photo, **When** they confirm the upload, **Then** the image is saved on the server, the profile photo updates across navbar, forum, leaderboard, and profile page without a full page reload.
3. **Given** a user has a custom profile photo, **When** they click "Remove Photo", **Then** the photo is deleted from the server and the DiceBear fallback avatar is displayed everywhere.
4. **Given** a user selects a file larger than 5MB, **When** the system validates, **Then** an error message is displayed indicating the file exceeds the maximum allowed size.
5. **Given** a user selects a non-image file (e.g., PDF), **When** the system validates, **Then** an error message is displayed indicating only image files are accepted.
6. **Given** a user replaces their existing photo with a new one, **When** the upload succeeds, **Then** the old image file is deleted from the server.

---

### User Story 2 - Change Password (Priority: P1)

A registered user (local account) wants to update their password for security reasons. They navigate to the Security section of Settings, enter their current password, then enter and confirm a new password that meets the strength requirements. A password strength indicator provides real-time feedback. After successful change, a confirmation message is displayed and optionally other active sessions are invalidated.

**Why this priority**: Password change is a core security feature that users expect. Blocking issue if absent.

**Independent Test**: Can be fully tested by logging in, navigating to Security settings, entering old/new passwords, and verifying the new password works on next login.

**Acceptance Scenarios**:

1. **Given** a user with a local account on the Security settings, **When** they enter a correct current password and a valid new password (≥8 chars, 1 uppercase, 1 digit, 1 special char) with matching confirmation, **Then** the password is updated and a success message is shown.
2. **Given** a user enters an incorrect current password, **When** they submit, **Then** an error message "Incorrect current password" is displayed and the password is not changed.
3. **Given** a user enters a new password that does not meet requirements, **When** they type, **Then** the password strength indicator shows "weak" and specific unmet criteria are highlighted.
4. **Given** the new password and confirmation do not match, **When** the user submits, **Then** an error message "Passwords do not match" is displayed.
5. **Given** a user logged in via Google OAuth, **When** they view the Security settings, **Then** the password change form is disabled with a message "Password managed by Google".

---

### User Story 3 - Choose Code Editor Theme (Priority: P2)

A user wants to customize the appearance of all code editors on the platform independently from the site's global dark/light theme. They go to the Preferences section of Settings, select a code editor theme from a dropdown (e.g., Monokai, Dracula, vs-dark), and see an immediate preview. The chosen theme is saved to their profile and applied across all code editors on the platform: duel editor, problem editor, sketchpad, and hackathon editor.

**Why this priority**: Enhances the coding experience significantly. The code editor is a central feature of the platform.

**Independent Test**: Can be fully tested by selecting a different editor theme in settings, then navigating to a problem page and verifying the editor uses the newly selected theme.

**Acceptance Scenarios**:

1. **Given** a user on the Preferences settings, **When** they select "Dracula" from the Code Editor Theme dropdown, **Then** a preview of the theme is shown immediately.
2. **Given** a user selects a new editor theme and saves, **When** they navigate to the problem-solving page, **Then** the code editor displays with the saved theme.
3. **Given** a user has set their editor theme to "Monokai", **When** they enter a duel room, **Then** the duel editor also uses "Monokai".
4. **Given** a user has not set an editor theme preference, **When** they use a code editor, **Then** the default "vs-dark" theme is applied.
5. **Given** a user changes the global site theme (dark/light), **When** they have a separate editor theme set, **Then** the editor theme remains independent and unchanged.

---

### User Story 4 - Change Email Address (Priority: P2)

A user wants to update the email address associated with their account. They navigate to the Account section of Settings, enter their current password for verification, then enter the new email. The system validates the new email is not already in use and is properly formatted.

**Why this priority**: Email change is a standard account management feature and important for account recovery.

**Independent Test**: Can be fully tested by changing email in settings and verifying the new email is shown in the profile and can be used for login.

**Acceptance Scenarios**:

1. **Given** a user on Account settings with a local account, **When** they enter their correct current password and a valid new email not already in use, **Then** the email is updated and a success message is shown.
2. **Given** a user enters an incorrect current password, **When** they submit the email change, **Then** an error "Incorrect password" is displayed.
3. **Given** a user enters an email already used by another account, **When** they submit, **Then** an error "This email is already in use" is displayed.
4. **Given** a user enters an invalid email format, **When** the field is validated, **Then** an error "Invalid email format" is displayed.
5. **Given** a user logged in via Google OAuth, **When** they view Account settings, **Then** the email change form is disabled with a message "Email managed by Google".

---

### User Story 5 - Choose Preferred Language (Priority: P2)

A user wants to use the platform in their preferred language. They navigate to the Preferences section of Settings and select French or English. The change is applied immediately without page reload. The preference is saved to their profile so it persists across sessions and devices.

**Why this priority**: Internationalization is a core principle of ByteBattle (Constitution Principle VII). Currently language is only stored locally.

**Independent Test**: Can be fully tested by switching language in settings, verifying UI text changes immediately, logging out, logging back in, and confirming the saved language is automatically applied.

**Acceptance Scenarios**:

1. **Given** a logged-in user on Preferences settings, **When** they select "Français", **Then** the entire UI switches to French immediately without page reload.
2. **Given** a user has saved "Français" as their preferred language, **When** they log out and log back in, **Then** the UI is automatically displayed in French.
3. **Given** a new user with no saved language preference, **When** they log in for the first time, **Then** the platform defaults to the browser's language (if supported) or English.
4. **Given** a user changes their language, **When** the change is applied, **Then** the preference is saved via an API call to the backend and persisted in the user's profile.

---

### User Story 6 - View Profile Statistics (Priority: P3)

A user wants to view their comprehensive statistics on their profile page. The profile page displays data including ELO rating, XP and level, duel record (W/L/D), win rate, leaderboard position, challenges solved, forum contributions, streak, and account dates.

**Why this priority**: Profile stats provide user engagement and motivation. Important but relies on data already collected.

**Independent Test**: Can be fully tested by navigating to the profile page and verifying all statistics match the user's actual data from the backend.

**Acceptance Scenarios**:

1. **Given** a user navigates to their profile page, **When** the page loads, **Then** their current ELO, XP, level, duel stats (won/lost/total), win rate, challenges solved count, forum post count, comment count, date joined, and last login are displayed.
2. **Given** a user with duel stats of 10 won and 5 lost, **When** the win rate is calculated, **Then** it displays "66.7%" following the canonical formula: `(Won / (Won + Lost)) * 100`.
3. **Given** a user with no duels played, **When** the win rate is calculated, **Then** it displays "0.0%" or "N/A" (no division by zero).

---

### User Story 7 - Settings Page Organization (Priority: P3)

A user wants a centralized, well-organized settings page to manage all their account preferences. The settings page has clear sections (Profile, Account, Preferences, Connections) organized as tabs. Each section groups related settings logically.

**Why this priority**: Good UX for organizing all the individual settings features. Partially exists already.

**Independent Test**: Can be fully tested by navigating to the settings page and verifying all sections are accessible and each contains the expected controls.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they navigate to `/settings`, **Then** they see tabs for Profile, Account/Security, Preferences, and Notifications.
2. **Given** a user on the Profile tab, **When** they view the section, **Then** they see photo upload, username (display), and bio/description fields.
3. **Given** a user on the Account tab, **When** they view the section, **Then** they see email change, password change, and account deletion options.
4. **Given** a user on the Preferences tab, **When** they view the section, **Then** they see language selector, code editor theme picker, and global theme toggle.
5. **Given** a user clicks "Delete Account", **When** prompted, **Then** a confirmation dialog requires their password before proceeding.

---

### User Story 8 - Delete Account (Priority: P3)

A user wants to permanently delete their account. They navigate to the "Danger Zone" section of Settings, click "Delete Account", and are presented with a confirmation dialog that requires entering their password. Upon confirmation, the account and all associated data are soft-deleted or permanently removed.

**Why this priority**: Required for user data sovereignty, but used infrequently.

**Independent Test**: Can be fully tested by attempting to delete an account, verifying the password check, then confirming the account is no longer accessible.

**Acceptance Scenarios**:

1. **Given** a user clicks "Delete Account" in the Danger Zone, **When** a confirmation dialog appears, **Then** the user must enter their current password and type "DELETE" to confirm.
2. **Given** correct password and confirmation, **When** the user confirms deletion, **Then** the account is deleted, the user is logged out, and redirected to the landing page.
3. **Given** the user enters an incorrect password in the confirmation dialog, **When** they submit, **Then** the deletion is blocked with an error message.

---

### Edge Cases

- What happens when a user uploads a corrupted image file? → The system validates the file MIME type and rejects non-image files with a clear error.
- What happens when the image processing (resize) fails on the server? → A 500 error is returned with a user-friendly message and the original avatar is preserved.
- What happens when a user changes their password while logged in from multiple devices? → Optionally, other sessions are invalidated; at minimum, new sessions require the new password.
- What happens when two users try to use the same email simultaneously? → Database unique constraint prevents duplicates; the second user sees "Email already in use".
- What happens when the DiceBear avatar service is unavailable? → A local fallback (initials or generic icon) is displayed.
- What happens when the user's session token expires during a settings change? → The user is redirected to login and their unsaved changes are not persisted.
- How does the editor theme behave on pages without a code editor? → It has no effect; the preference is read only by editor components.

## Requirements *(mandatory)*

### Functional Requirements

#### Profile Photo
- **FR-001**: System MUST allow users to upload profile photos in JPG, PNG, or WebP format.
- **FR-002**: System MUST reject uploads exceeding 5MB with a clear error message.
- **FR-003**: System MUST validate file MIME type to ensure only image files are accepted.
- **FR-004**: System MUST resize uploaded images to 200×200 pixels on the server before storage.
- **FR-005**: System MUST store uploaded images in a dedicated `uploads/avatars/` directory on the server.
- **FR-006**: System MUST display the DiceBear avatar as a fallback when no custom photo is uploaded.
- **FR-007**: System MUST display a circular preview of the selected image before upload confirmation.
- **FR-008**: System MUST delete the previous photo file from the server when a new one is uploaded.
- **FR-009**: System MUST propagate the updated profile photo to all UI locations (navbar, forum posts, comments, leaderboard, profile) without requiring page reload.

#### Code Editor Theme
- **FR-010**: System MUST allow users to select a code editor theme from the following options: vs-light, vs-dark, Monokai, GitHub Dark, Dracula, One Dark Pro, Solarized Dark, Solarized Light.
- **FR-011**: System MUST persist the selected editor theme in the user's profile in the database.
- **FR-012**: System MUST apply the selected editor theme across ALL code editors on the platform (Duel, Problems, Sketchpad, Hackathons).
- **FR-013**: System MUST show a real-time preview when a user selects a different editor theme.
- **FR-014**: System MUST keep the code editor theme independent from the global site theme (dark/light mode).
- **FR-015**: System MUST default to "vs-dark" when no editor theme preference is saved.

#### Password Change
- **FR-016**: System MUST allow users with local accounts to change their password.
- **FR-017**: System MUST verify the current password before allowing a password change.
- **FR-018**: System MUST enforce password requirements: minimum 8 characters, at least 1 uppercase letter, at least 1 digit, at least 1 special character.
- **FR-019**: System MUST display a password strength indicator (weak/medium/strong) in real-time as the user types.
- **FR-020**: System MUST confirm that new password and confirmation match before submission.
- **FR-021**: System MUST display a success message after successful password change.
- **FR-022**: System MUST display "Password managed by Google" and disable the form for OAuth users.

#### Email Change
- **FR-023**: System MUST allow users with local accounts to change their email address.
- **FR-024**: System MUST verify the current password before allowing an email change.
- **FR-025**: System MUST verify the new email is not already used by another account.
- **FR-026**: System MUST validate the email format before submission.
- **FR-027**: System MUST display "Email managed by Google" and disable the form for OAuth users.

#### Language Preference
- **FR-028**: System MUST allow users to select their preferred language (French or English).
- **FR-029**: System MUST persist the language preference in the user's profile in the database.
- **FR-030**: System MUST load the saved language preference automatically on login.
- **FR-031**: System MUST apply language changes immediately without page reload.
- **FR-032**: System MUST fall back to the browser's language (if supported) or English when no preference is saved.

#### Profile Statistics
- **FR-033**: System MUST display comprehensive user statistics on the profile page: ELO rating, XP/level, duels played/won/lost, win rate (using canonical formula), challenges solved count, forum post count, comment count, date joined, last login.
- **FR-034**: System MUST calculate win rate using the canonical formula: `(Won / (Won + Lost)) * 100`, displayed with one decimal place.
- **FR-035**: System MUST handle edge cases where a user has zero duels (display "0.0%" or "N/A").

#### Settings Page
- **FR-036**: System MUST provide a dedicated settings page at `/settings` organized in tabs.
- **FR-037**: System MUST include a Profile section with photo management, username display, and bio/description field (max 250 characters).
- **FR-038**: System MUST include an Account/Security section with email change, password change, and account deletion.
- **FR-039**: System MUST include a Preferences section with language selector, editor theme picker, and global theme toggle.
- **FR-040**: System MUST include a Notifications section for toggling notification types.
- **FR-041**: System MUST include a Danger Zone with account deletion requiring password confirmation.

#### Account Deletion
- **FR-042**: System MUST allow users to delete their account after password verification and confirmation.
- **FR-043**: System MUST log the user out and redirect to the landing page after successful deletion.

#### Security
- **FR-044**: All profile modification endpoints MUST be protected by authentication (JWT).
- **FR-045**: Sensitive data (password hashes) MUST NEVER be returned in API responses.
- **FR-046**: System MUST apply rate limiting on sensitive endpoints (password change, email change).
- **FR-047**: System MUST validate MIME type and file size for image uploads server-side.

### Key Entities *(include if feature involves data)*

- **User**: Central entity extended with new fields: `bio` (short text up to 250 chars), `editorTheme` (string representing the selected editor theme), `preferredLanguage` (string, "fr" or "en"), `lastLogin` (date tracking the last login time). Existing fields: `profileImage`, `email`, `passwordHash`, `isOAuthUser`, `provider`, `elo`, `xp`, `level`, `duelsWon`, `duelsLost`, `duelsTotal`.
- **ProfileImage**: A file stored on the server at `uploads/avatars/{userId}.{ext}`, referenced by the User's `profileImage` field containing the relative URL path.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can upload, preview, and save a profile photo in under 30 seconds.
- **SC-002**: The uploaded profile photo appears across all platform areas (navbar, forum, leaderboard, profile) within 2 seconds of upload completion.
- **SC-003**: Users can change their password with real-time strength feedback, completing the entire flow in under 1 minute.
- **SC-004**: Users can change their email address in under 1 minute, with immediate feedback on validation errors.
- **SC-005**: Language preference change takes effect across the entire UI within 1 second without page reload.
- **SC-006**: Code editor theme change applies to all editors across the platform on the next editor load.
- **SC-007**: Profile statistics page loads and displays all data within 2 seconds.
- **SC-008**: 100% of profile modification endpoints reject unauthenticated requests.
- **SC-009**: OAuth users see appropriate "managed by Google" messages for password and email sections, preventing confusion.
- **SC-010**: Settings page is navigable and functional on both desktop and mobile viewports.

## Assumptions

- Users have stable internet connectivity for file uploads and API calls.
- The existing DiceBear avatar service remains available for fallback avatars; a local fallback (user initials) is used if DiceBear is unreachable.
- The existing `AuthContext`, `ThemeContext`, and `LanguageContext` will be extended rather than replaced.
- The existing Settings page UI structure (tab-based layout) will be enhanced, not rewritten from scratch.
- The existing User model in the database will be extended with new fields (`bio`, `editorTheme`, `preferredLanguage`, `lastLogin`).
- Image processing (resize to 200×200) uses Sharp, which is already listed in the approved technology stack.
- The platform currently has no dedicated code editor component wrapping Monaco/CodeMirror; code editors exist inline in pages (Problem, DuelRoom, SketchpadPage, CanvasEditor). The editor theme preference will need to be injected into each of these page-level editors.
- Email verification (sending a confirmation link to the new email) is out of scope for the MVP; the email is updated directly after password verification.
- Two-Factor Authentication (2FA) is out of scope for this feature; the existing placeholder in Settings remains unchanged.
- Google account linking/unlinking is out of scope for this feature.
- ELO chart over time (30-day graph) is a stretch goal, not required for MVP.
- Streak tracking (consecutive days of activity) requires a new tracking mechanism and is treated as a stretch goal.
- Badges/achievements display on the profile page leverages existing Badge model data; creating new badge rules is out of scope.
