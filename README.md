# JavaScript Validations

Client-side JavaScript for Microsoft Dataverse / Dynamics 365 model-driven
forms. The scripts use the form execution context and the `Xrm` client API to
validate input, control form fields, and read or update related records.

## Files

### `tms_WowMomentValidations.js`

Form rules and user-interface behavior for Wow Moment records:

- Rejects email addresses ending in `@nsquarexperts.com`.
- Filters the Shop lookup by the selected Occasion and disables the lookup
  until an Occasion is selected.
- Shows and requires the spouse name for the configured occasion.
- Locks selected record fields when Management Approval has a value.
- Requires the Wow Moment date to be between 2 and 180 days from today.
- Validates first and last names to allow at least two letters or hyphens.
- Validates mobile numbers in `+91XXXXXXXXXX` format.
- Requires rejection remarks when the Management Approval status is Rejected.

### `tms_WowMomentWebApis.js`

Dataverse Web API operations for Wow Moment forms:

- `populateAgentDetails` fills agent name and email from the current system
  user when creating a new record.
- `createOrPopulateContact` looks up a Contact by email, selects the existing
  Contact when found, or creates and selects one when not found.
- `updateLinkedContact` copies the Wow Moment contact details to its linked
  Contact.
- `validateDuplicateWowMoment` blocks a duplicate active Wow Moment with the
  same email, occasion, and date/time. The `TMS_MATCH_WHOLE_DAY` setting
  controls whether matching uses the whole day or the same minute.
- `validateShopFutureEvents` prevents selection of a Shop that already has
  20 or more active future events.
- `validateDuplicateApprovedEmail` checks for another record with the same
  email and the configured approval status.
- `validateWowMomentOnSave` checks for duplicate email/occasion/date-time
  records and duplicate approved-email records before saving. Its settings
  control whole-day versus same-minute matching and whether email uniqueness
  applies to approved records only or active/approved records. Autosave is
  canceled by this handler.

### `tms_wowmoment_ribbon.js`

Ribbon command logic for Wow Moment records, exposed through `TMS.WowRibbon`:

- `canInitiate`, `canApprove`, and `canReject` control command availability.
- `initiate`, `approve`, and `reject` update Management Approval and record
  the acting user's name and timestamp in the Details JSON field.
- `refreshRibbon` can be registered on field On Change events to update
  command availability.

Approval and rejection commands are available only to users with the
configured `Event Approver` and `Event Rejection` security roles, respectively.

### `tms_ShopWebAPIs.js`

- `updateEventsCounter` runs for an existing Shop record, counts its related
  Wow Moment records, updates `tms_eventcounter`, and refreshes the form.

### `tms_EventFeedbackValidations.js`

Feedback form rules:

- Requires feedback comments for 1- or 2-star ratings.
- Shows and requires follow-up remarks when follow-up is required; otherwise
  clears and hides the remarks field.
- Includes save-time checks for both required feedback comments and follow-up
  remarks.

## Setup

1. Add the relevant JavaScript file as a web resource in the Dataverse
   solution and publish it.
2. Add the library to the appropriate model-driven app form.
3. Register the needed functions as form or field event handlers. Pass the
   execution context to each handler (enable **Pass execution context as first
   parameter**).
4. Register save validations on the form's On Save event and field-dependent
   behaviors on the relevant On Load or On Change events. Register lookup
   filtering on form load. Register `validateWowMomentOnSave` on the Wow
   Moment form's On Save event; this handler cancels autosave.
5. Confirm the logical names used in the scripts match the table and column
   names in the target environment.
6. To configure Wow Moment ribbon commands, add `tms_wowmoment_ribbon.js` to
   the form libraries and bind command actions and enable rules to the
   corresponding `TMS.WowRibbon` functions. Register `refreshRibbon` on
   relevant field On Change events so command availability updates as values
   change. Confirm the configured security role names and status option values
   match the target environment.

The scripts assume the Dataverse client APIs (`Xrm.WebApi`, `Xrm.Navigation`,
and model-driven form context) are available. They are not standalone browser
scripts.

## Environment-specific settings

Review option-set values before deploying:

- `TMS_APPROVED_VALUE` in `tms_WowMomentWebApis.js` is set to `2`.
- The Management Approval values in `tms_wowmoment_ribbon.js` are set to
  Initiated `1`, Approved `2`, and Rejected `3`.
- `TMS_EMAIL_ANY_ACTIVE_OR_APPROVED` controls whether the duplicate-email
  check applies to approved records only (`false`) or active or approved
  records (`true`).
- The rejected Management Approval value in
  `tms_WowMomentValidations.js` is set to `3`.
- The spouse-name rule treats Occasion value `3` as the applicable occasion.

These values must match the option-set metadata in the target Dataverse
environment. The scripts also rely on the `tms_*` table and column logical
names referenced in the source.
