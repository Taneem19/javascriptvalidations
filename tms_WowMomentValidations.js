// Validation 1 - Email Validation
function validateEmailDomain(executionContext)
{
    var formContext = executionContext.getFormContext();

    var email = formContext.getAttribute("tms_emailaddress").getValue();

    if (email == null)
    {
        return;
    }

    email = email.toLowerCase();

    if (email.endsWith("@nsquarexperts.com"))
    {
        formContext.ui.setFormNotification(
            "Company email addresses are not allowed.",
            "ERROR",
            "emailValidation"
        );

        formContext.getAttribute("tms_emailaddress").setValue(null);
    }
    else
    {
        formContext.ui.clearFormNotification("emailValidation");
    }
}

// Validation 2 - Shopfilter
function registerShopFilter(executionContext)
{
    var formContext = executionContext.getFormContext();

    var shopControl = formContext.getControl("tms_shop");

    shopControl.addPreSearch(function ()
    {
        applyShopFilter(formContext);
    });
}

function applyShopFilter(formContext)
{
    var occasion =
        formContext.getAttribute("tms_occasion")
                   .getValue();

    if (!occasion)
    {
        return;
    }

    var filterXml =
        "<filter type='and'>" +
            "<condition attribute='tms_eventsorganizedhere'" +
            " operator='eq'" +
            " value='" + occasion + "' />" +
        "</filter>";

    formContext
        .getControl("tms_shop")
        .addCustomFilter(filterXml);
}

// Validation 3 - Control Shop State
function controlShopState(executionContext)
{
    var formContext = executionContext.getFormContext();

    var occasion =
        formContext.getAttribute("tms_occasion").getValue();

    var shopAttribute =
        formContext.getAttribute("tms_shop");

    var shopControl =
        formContext.getControl("tms_shop");


    if (!occasion)
    {
        shopControl.setDisabled(true);
    }
    else
    {
        shopControl.setDisabled(false);
    }
}

function occasionChanged(executionContext)
{
    var formContext = executionContext.getFormContext();

    var occasion =
        formContext.getAttribute("tms_occasion").getValue();

    var shopAttribute =
        formContext.getAttribute("tms_shop");

    var shopControl =
        formContext.getControl("tms_shop");

    shopAttribute.setValue(null);

    if (!occasion)
    {
        shopControl.setDisabled(true);
    }
    else
    {
        shopControl.setDisabled(false);
    }
}

// Validation 4 - Validate Spouse Name
function manageSpouseName(executionContext)
{
    var formContext = executionContext.getFormContext();

    var occasion =
        formContext.getAttribute("tms_occasion")
                   .getValue();

    var spouseAttribute =
        formContext.getAttribute("tms_spousename");

    var spouseControl =
        formContext.getControl("tms_spousename");

    if (occasion === 3)
    {
        spouseControl.setVisible(true);

        spouseAttribute.setRequiredLevel("required");
    }
    else
    {
        spouseAttribute.setValue(null);

        spouseAttribute.setRequiredLevel("none");

        spouseControl.setVisible(false);
    }
}

// Validation 5 - Lock fields based on Status
function lockFieldsBasedOnStatus(executionContext)
{
    var formContext = executionContext.getFormContext();

    var status =
        formContext.getAttribute("tms_managementapproval")
                   .getValue();

    var fieldsToLock = [
        "tms_title",
        "tms_firstname",
        "tms_lastname",
        "tms_emailaddress",
        "tms_mobilenumber",
        "tms_wowmomentdate",
        "tms_occasion",
        "tms_shop"
    ];

    var shouldLock = status !== null;

    for(var i = 0; i < fieldsToLock.length; i++)
    {
        var control =
            formContext.getControl(fieldsToLock[i]);

        if(control)
        {
            control.setDisabled(shouldLock);
        }
    }
}

// Validation 6 - Invalid Wow Moment Date Validation
function validateWowMomentDate(executionContext)
{
    var formContext = executionContext.getFormContext();

    var eventArgs =
        executionContext.getEventArgs();

    var wowMomentDate =
        formContext.getAttribute("tms_wowmomentdate")
                   .getValue();

    if (!wowMomentDate)
    {
        return;
    }

    var today = new Date();

    today.setHours(0,0,0,0);

    var minDate = new Date(today);

    minDate.setDate(today.getDate() + 2);

    var maxDate = new Date(today);

    maxDate.setDate(today.getDate() + 180);

    wowMomentDate.setHours(0,0,0,0);

    if (
        wowMomentDate < minDate ||
        wowMomentDate > maxDate
    )
    {
        eventArgs.preventDefault();

        formContext.ui.setFormNotification(
            "Invalid Wow Moment Date. Please select a date that is at least 2 days after today and no more than 180 days from today.",
            "ERROR",
            "wowMomentDateValidation"
        );
    }
    else
    {
        formContext.ui.clearFormNotification(
            "wowMomentDateValidation"
        );
    }
}

//Validation 7 - first Name and last name validation
function validateName(executionContext)
{
    var formContext = executionContext.getFormContext();

    var fieldName =
        executionContext.getEventSource().getName();

    var attribute =
        formContext.getAttribute(fieldName);

    var value =
        attribute.getValue();

    if (!value)
    {
        return;
    }

    var regex =
        /^[A-Za-z-]{2,}$/;

    if (!regex.test(value))
    {
        attribute.setValue(null);

        formContext.ui.setFormNotification(
            "Only alphabets and hyphens are allowed. Name must contain at least 2 characters.",
            "ERROR",
            fieldName
        );
    }
    else
    {
        formContext.ui.clearFormNotification(fieldName);
    }
}

// Validation 8 - Mobile number validation
function validateMobileNumber(executionContext)
{
    var formContext = executionContext.getFormContext();

    var mobile =
        formContext.getAttribute("tms_mobilenumber")
                   .getValue();

    if (!mobile)
    {
        return;
    }

    var regex = /^\+91\d{10}$/;

    if (!regex.test(mobile))
    {
        formContext.getAttribute("tms_mobilenumber")
                   .setValue(null);

        formContext.ui.setFormNotification(
            "Invalid mobile number. Enter the number in +91XXXXXXXXXX format with exactly 10 digits after +91.",
            "ERROR",
            "mobileValidation"
        );
    }
    else
    {
        formContext.ui.clearFormNotification(
            "mobileValidation"
        );
    }
}

// Validation 9 - Rejection Remarks validation
function manageRejectionRemarks(executionContext)
{
    var formContext = executionContext.getFormContext();

    var status =
        formContext.getAttribute("tms_managementapproval")
                   .getValue();

    var remarks =
        formContext.getAttribute("tms_rejectionremarks");

    // Replace with actual Rejected option value
    var rejectedValue = 3;

    if(status === rejectedValue)
    {
        remarks.setRequiredLevel("required");
    }
    else
    {
        remarks.setRequiredLevel("none");
    }
}

function validateRejectionRemarks(executionContext)
{
    var formContext = executionContext.getFormContext();

    var eventArgs =
        executionContext.getEventArgs();

    var status =
        formContext.getAttribute("tms_managementapproval")
                   .getValue();

    var remarks =
        formContext.getAttribute("tms_rejectionremarks")
                   .getValue();

    // Replace with actual Rejected option value
    var rejectedValue = 3;

    if(status === rejectedValue && !remarks)
    {
        eventArgs.preventDefault();

        formContext.ui.setFormNotification(
            "Rejection Remarks are required when the Management Approval Status is Rejected.",
            "ERROR",
            "rejectionRemarksValidation"
        );
    }
    else
    {
        formContext.ui.clearFormNotification(
            "rejectionRemarksValidation"
        );
    }
}