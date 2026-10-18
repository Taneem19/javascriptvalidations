// Web API 1 - Get System User Details and Autopopulate
function populateAgentDetails(executionContext)
{
    var formContext = executionContext.getFormContext();

    // Run only for new records
    if (formContext.ui.getFormType() !== 1)
    {
        return;
    }

    var userId =
        Xrm.Utility.getGlobalContext()
                   .userSettings
                   .userId
                   .replace("{","")
                   .replace("}","");

    Xrm.WebApi.retrieveRecord(
        "systemuser",
        userId,
        "?$select=fullname,internalemailaddress"
    ).then(
        function success(result)
        {
            formContext
                .getAttribute("tms_agentname")
                .setValue(result.fullname);

            formContext
                .getAttribute("tms_agentemail")
                .setValue(result.internalemailaddress);
        },
        function(error)
        {
            console.log(error.message);
        }
    );
}

// Web API 3 - Check contact Existence and Autopopulate
function createOrPopulateContact(executionContext)
{
    var formContext = executionContext.getFormContext();

    var firstName =
        formContext.getAttribute("tms_firstname").getValue();

    var lastName =
        formContext.getAttribute("tms_lastname").getValue();

    var email =
        formContext.getAttribute("tms_emailaddress").getValue();

    var mobile =
        formContext.getAttribute("tms_mobilenumber").getValue();

    if (!email)
    {
        return;
    }

    var query =
        "?$select=contactid,fullname,emailaddress1" +
        "&$filter=emailaddress1 eq '" + email + "'";

    Xrm.WebApi.retrieveMultipleRecords(
        "contact",
        query
    ).then(
        function success(result)
        {
            if (result.entities.length > 0)
            {
                var contact =
                    result.entities[0];

                var lookupValue =
                [
                    {
                        id: contact.contactid,
                        name: contact.fullname,
                        entityType: "contact"
                    }
                ];

                formContext.getAttribute("tms_contact")
                           .setValue(lookupValue);
            }
            else
            {
                var contactData =
                {
                    firstname: firstName,
                    lastname: lastName,
                    emailaddress1: email,
                    mobilephone: mobile,
                    telephone1: mobile
                };

                Xrm.WebApi.createRecord(
                    "contact",
                    contactData
                ).then(
                    function success(createResult)
                    {
                        Xrm.WebApi.retrieveRecord(
                            "contact",
                            createResult.id,
                            "?$select=fullname"
                        ).then(
                            function success(contactResult)
                            {
                                var lookupValue =
                                [
                                    {
                                        id: createResult.id,
                                        name: contactResult.fullname,
                                        entityType: "contact"
                                    }
                                ];

                                formContext.getAttribute("tms_contact")
                                           .setValue(lookupValue);
                            },
                            function(error)
                            {
                                console.log(
                                    "Error retrieving created contact: " +
                                    error.message
                                );
                            }
                        );
                    },
                    function(error)
                    {
                        console.log(
                            "Error creating contact: " +
                            error.message
                        );
                    }
                );
            }
        },
        function(error)
        {
            console.log(
                "Error retrieving existing contact: " +
                error.message
            );
        }
    );
}

// Web API 4A - Update Contact if details are changed
function updateLinkedContact(executionContext)
{
    var formContext = executionContext.getFormContext();

    var contactLookup =
        formContext.getAttribute("tms_contact")
                   .getValue();

    if (!contactLookup)
    {
        return;
    }

    var contactId =
        contactLookup[0].id
                        .replace("{", "")
                        .replace("}", "");

    var contactData =
    {
        firstname:
            formContext.getAttribute("tms_firstname").getValue(),

        lastname:
            formContext.getAttribute("tms_lastname").getValue(),

        emailaddress1:
            formContext.getAttribute("tms_emailaddress").getValue(),

        mobilephone:
            formContext.getAttribute("tms_mobilenumber").getValue(),

        telephone1:
            formContext.getAttribute("tms_mobilenumber").getValue()
    };

    Xrm.WebApi.updateRecord(
        "contact",
        contactId,
        contactData
    ).then(
        function success()
        {
            console.log("Contact updated successfully.");
        },
        function(error)
        {
            console.log(error.message);
        }
    );
}

// Web API 4B - Validate duplicate wow moment
var _tmsWowBypass = false;

// false = duplicate if same date AND time (to the minute)
// true  = duplicate if same calendar day (any time)
var TMS_MATCH_WHOLE_DAY = false;

function tmsPad(n) {
    return ("0" + n).slice(-2);
}

// Formats a UTC-based Date as a literal "Z" string (no time zone shift)
function tmsToLiteral(d) {
    return d.getUTCFullYear() + "-" + tmsPad(d.getUTCMonth() + 1) + "-" +
           tmsPad(d.getUTCDate()) + "T" + tmsPad(d.getUTCHours()) + ":" +
           tmsPad(d.getUTCMinutes()) + ":" + tmsPad(d.getUTCSeconds()) + "Z";
}

function validateDuplicateWowMoment(executionContext) {

    // Second pass (our own re-save): let it through
    if (_tmsWowBypass) {
        _tmsWowBypass = false;
        return;
    }

    var formContext = executionContext.getFormContext();
    var eventArgs = executionContext.getEventArgs();

    var emailAttr = formContext.getAttribute("tms_emailaddress");
    var occasionAttr = formContext.getAttribute("tms_occasion");
    var dateAttr = formContext.getAttribute("tms_wowmomentdate");

    var email = emailAttr.getValue();
    var occasion = occasionAttr.getValue();   // number (option set value)
    var wowMomentDate = dateAttr.getValue();  // JS Date

    if (!email || occasion === null || !wowMomentDate) {
        return; // let required-field rules handle blanks
    }

    // On update, skip if none of the key fields changed
    var isUpdate = formContext.ui.getFormType() === 2;
    if (isUpdate && !emailAttr.getIsDirty() && !occasionAttr.getIsDirty() && !dateAttr.getIsDirty()) {
        return;
    }

    // Cancel this save NOW (must be synchronous)
    eventArgs.preventDefault();
    var saveMode = eventArgs.getSaveMode();

    var currentRecordId = formContext.data.entity.getId().replace(/[{}]/g, "").toLowerCase();
    var safeEmail = email.trim().toLowerCase().replace(/'/g, "''");

    // Treat the on-screen components as UTC, so no shift happens
    var y = wowMomentDate.getFullYear();
    var m = wowMomentDate.getMonth();
    var d = wowMomentDate.getDate();
    var start, end;

    if (TMS_MATCH_WHOLE_DAY) {
        start = new Date(Date.UTC(y, m, d, 0, 0, 0));
        end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    } else {
        start = new Date(Date.UTC(y, m, d, wowMomentDate.getHours(), wowMomentDate.getMinutes(), 0));
        end = new Date(start.getTime() + 60 * 1000);
    }

    var query =
        "?$select=tms_wowmomentid" +
        "&$top=1" +
        "&$filter=tms_emailaddress eq '" + safeEmail + "'" +
        " and tms_occasion eq " + occasion +
        " and tms_wowmomentdate ge " + tmsToLiteral(start) +
        " and tms_wowmomentdate lt " + tmsToLiteral(end) +
        " and statecode eq 0";

    if (currentRecordId) {
        query += " and tms_wowmomentid ne " + currentRecordId;
    }

    Xrm.WebApi.retrieveMultipleRecords("tms_wowmoment", query).then(
        function success(result) {
            if (result.entities.length > 0) {
                formContext.ui.setFormNotification(
                    "A Wow Moment record already exists with the same Email Address, Occasion and Wow Moment Date.",
                    "ERROR",
                    "duplicateWowMoment"
                );
                Xrm.Navigation.openAlertDialog({
                    title: "Duplicate Record",
                    text: "A Wow Moment record with the same Email Address, Occasion and Wow Moment Date already exists. The record was not saved."
                });
            } else {
                formContext.ui.clearFormNotification("duplicateWowMoment");
                _tmsWowBypass = true;

                if (saveMode === 2) {
                    formContext.data.save({ saveMode: "saveandclose" });
                } else if (saveMode === 59) {
                    formContext.data.save({ saveMode: "saveandnew" });
                } else {
                    formContext.data.save();
                }
            }
        },
        function error(err) {
            Xrm.Navigation.openErrorDialog({ message: "Duplicate check failed: " + err.message });
        }
    );
}

// Web API 5 - Shop Count Validation for Future Events
function validateShopFutureEvents(executionContext)
{
    var formContext = executionContext.getFormContext();

    var shopLookup =
        formContext.getAttribute("tms_shop")
                   .getValue();

    if (!shopLookup)
    {
        formContext.ui.clearFormNotification("shopLimit");
        return;
    }

    var shopId =
        shopLookup[0].id
                  .replace("{", "")
                  .replace("}", "");

    var currentDateTime =
        new Date().toISOString();

    var query =
        "?$select=tms_wowmomentid" +
        "&$top=20" +
        "&$filter=_tms_shop_value eq " + shopId +
        " and tms_wowmomentdate ge " + currentDateTime +
        " and statecode eq 0";

    Xrm.WebApi.retrieveMultipleRecords(
        "tms_wowmoment",
        query
    ).then(
        function success(result)
        {
            if (result.entities.length >= 20)
            {
                formContext.getAttribute("tms_shop")
                           .setValue(null);

                formContext.ui.setFormNotification(
                    "This shop already has the maximum limit of 20 future events scheduled.",
                    "ERROR",
                    "shopLimit"
                );

                Xrm.Navigation.openAlertDialog({
                    title: "Shop Limit Exceeded",
                    text: "This shop already has 20 future events scheduled. Please select another shop."
                });
            }
            else
            {
                formContext.ui.clearFormNotification(
                    "shopLimit"
                );
            }
        },
        function(error)
        {
            console.log(
                "Future Event Validation Error: " +
                error.message
            );
        }
    );
}

// Web API 6 - Validate Duplicate Email Addresses with Active or Approved Wow Moment Records
var _tmsApprovedEmailBypass = false;

// Option set value for "Approved" in Management Approval (verify yours,
// custom option sets usually start at 100000000)
var TMS_APPROVED_VALUE = 2;

// false = block if another APPROVED record has this email
// true  = block if another ACTIVE or APPROVED record has this email
var TMS_EMAIL_ANY_ACTIVE_OR_APPROVED = false;

function validateDuplicateApprovedEmail(executionContext) {

    if (_tmsApprovedEmailBypass) {
        _tmsApprovedEmailBypass = false;
        return;
    }

    var formContext = executionContext.getFormContext();
    var eventArgs = executionContext.getEventArgs();

    var emailAttr = formContext.getAttribute("tms_emailaddress");
    var approvalAttr = formContext.getAttribute("tms_managementapproval");

    var email = emailAttr.getValue();

    if (!email) {
        return;
    }

    // On update, skip if neither field changed
    var isUpdate = formContext.ui.getFormType() === 2;
    if (isUpdate && !emailAttr.getIsDirty() && !approvalAttr.getIsDirty()) {
        return;
    }

    // Cancel this save now (must be synchronous)
    eventArgs.preventDefault();
    var saveMode = eventArgs.getSaveMode();

    var currentRecordId = formContext.data.entity.getId().replace(/[{}]/g, "").toLowerCase();
    var safeEmail = email.trim().toLowerCase().replace(/'/g, "''");

    var statusFilter = TMS_EMAIL_ANY_ACTIVE_OR_APPROVED
        ? " and (statecode eq 0 or tms_managementapproval eq " + TMS_APPROVED_VALUE + ")"
        : " and tms_managementapproval eq " + TMS_APPROVED_VALUE;

    var query =
        "?$select=tms_wowmomentid" +
        "&$top=1" +
        "&$filter=tms_emailaddress eq '" + safeEmail + "'" +
        statusFilter;

    if (currentRecordId) {
        query += " and tms_wowmomentid ne " + currentRecordId;
    }

    Xrm.WebApi.retrieveMultipleRecords("tms_wowmoment", query).then(
        function success(result) {
            if (result.entities.length > 0) {
                var msg = TMS_EMAIL_ANY_ACTIVE_OR_APPROVED
                    ? "Another active or approved Wow Moment record already exists with this Email Address."
                    : "An approved Wow Moment record already exists with this Email Address.";

                formContext.ui.setFormNotification(msg, "ERROR", "duplicateApprovedEmail");
                Xrm.Navigation.openAlertDialog({
                    title: "Duplicate Email Address",
                    text: msg + " The record was not saved."
                });
            } else {
                formContext.ui.clearFormNotification("duplicateApprovedEmail");
                _tmsApprovedEmailBypass = true;

                if (saveMode === 2) {
                    formContext.data.save({ saveMode: "saveandclose" });
                } else if (saveMode === 59) {
                    formContext.data.save({ saveMode: "saveandnew" });
                } else {
                    formContext.data.save();
                }
            }
        },
        function (error) {
            Xrm.Navigation.openErrorDialog({
                message: "Approved Email Validation Failed: " + error.message
            });
        }
    );
}
