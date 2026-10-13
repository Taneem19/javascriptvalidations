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

    // Always clear selected shop when Occasion changes
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