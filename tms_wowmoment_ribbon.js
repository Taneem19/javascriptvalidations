// Ribbon button logic for the Wow Moment entity.  

var TMS = TMS || {};
 
TMS.WowRibbon = (function () {
    "use strict";
 
    // ---------- Schema names ----------
    var F = {
        OCCASION: "tms_occasion",
        SHOP:     "tms_shop",
        APPROVAL: "tms_managementapproval",
        DETAILS:  "tms_details"
    };
 
    // Management Approval option values
    var STATUS = { INITIATED: 1, APPROVED: 2, REJECTED: 3 };
 
    // Security role names (must match exactly)
    var ROLE_APPROVER = "Event Approver";
    var ROLE_REJECTER = "Event Rejection";
 
    // true = hide Initiate once the record is Initiated/Approved/Rejected
    var HIDE_INITIATE_AFTER_START = true;
    // ----------------------------------
 
    function getValue(formContext, name) {
        var attr = formContext.getAttribute(name);
        return attr ? attr.getValue() : null;
    }
 
    function hasRole(roleName) {
        var found = false;
        var roles = Xrm.Utility.getGlobalContext().userSettings.roles;
        roles.forEach(function (r) {
            if (r.name && r.name.toLowerCase() === roleName.toLowerCase()) {
                found = true;
            }
        });
        console.log("TMS: hasRole('" + roleName + "') =", found);
        return found;
    }
 
    // Writes the current user's name and the current date into the JSON in Details.
    function updateDetails(formContext, byKey, dateKey) {
        var attr = formContext.getAttribute(F.DETAILS);
        var items = [];
 
        try {
            items = JSON.parse(attr.getValue() || "[]");
        } catch (e) {
            items = [];
        }
 
        var target = null;
        for (var i = 0; i < items.length; i++) {
            if (items[i].hasOwnProperty(byKey)) {
                target = items[i];
                break;
            }
        }
        if (!target) {
            target = {};
            items.push(target);
        }
 
        target[byKey] = Xrm.Utility.getGlobalContext().userSettings.userName;
        target[dateKey] = new Date().toISOString();
 
        attr.setValue(JSON.stringify(items, null, 2));
        attr.setSubmitMode("always");
        console.log("TMS: Details updated -", byKey, "=", target[byKey], dateKey, "=", target[dateKey]);
    }
 
    function requiredFieldsFilled(formContext) {
        var missing = [];
        formContext.data.entity.attributes.forEach(function (attr) {
            if (attr.getRequiredLevel() === "required" && attr.getValue() === null) {
                missing.push(attr.getName());
            }
        });
        if (missing.length > 0) {
            console.log("TMS: Missing required fields -", missing.join(", "));
            formContext.ui.setFormNotification(
                "Please fill all mandatory fields before continuing.", "ERROR", "tmsRequired");
            return false;
        }
        formContext.ui.clearFormNotification("tmsRequired");
        return true;
    }
 
    // Saves the form. The On Save validation handler cancels the first save and
    // re-saves after its check, so a "PreventDefault" rejection (2200000005) is expected.
    function saveForm(formContext) {
        formContext.data.save().then(
            function () {
                console.log("TMS: Save SUCCEEDED");
            },
            function (err) {
                if (err && err.errorCode === 2200000005) {
                    console.log("TMS: Save cancelled by validation handler (expected, will re-save)");
                    return;
                }
                console.log("TMS: Save FAILED -", err && err.message, err);
            }
        );
    }
 
    // ---------------- ENABLE RULES (true = show button) ----------------
 
    function canInitiate(primaryControl) {
        var occasion = getValue(primaryControl, F.OCCASION);
        var shop = getValue(primaryControl, F.SHOP);
 
        if (occasion === null || !shop || shop.length === 0) { return false; }
 
        if (HIDE_INITIATE_AFTER_START) {
            var status = getValue(primaryControl, F.APPROVAL);
            if (status === STATUS.INITIATED ||
                status === STATUS.APPROVED ||
                status === STATUS.REJECTED) {
                return false;
            }
        }
        return true;
    }
 
    function canApprove(primaryControl) {
        var status = getValue(primaryControl, F.APPROVAL);
        return status === STATUS.INITIATED && hasRole(ROLE_APPROVER);
    }
 
    function canReject(primaryControl) {
        var status = getValue(primaryControl, F.APPROVAL);
        return status === STATUS.INITIATED && hasRole(ROLE_REJECTER);
    }
 
    // ---------------- COMMAND ACTIONS (button clicks) ----------------
 
    function initiate(primaryControl) {
        console.log("TMS: Initiate clicked");
        var formContext = primaryControl;
 
        if (!requiredFieldsFilled(formContext)) {
            console.log("TMS: Initiate blocked - required fields missing");
            return;
        }
 
        formContext.getAttribute(F.APPROVAL).setValue(STATUS.INITIATED);
        updateDetails(formContext, "Initiated_By", "Initiated_Date");
        console.log("TMS: Initiate - saving now");
        saveForm(formContext);
    }
 
    function approve(primaryControl) {
        console.log("TMS: Approve clicked");
        var formContext = primaryControl;
 
        Xrm.Navigation.openConfirmDialog({
            title: "Approve Wow Moment",
            text: "Are you sure you want to approve this Wow Moment?",
            confirmButtonLabel: "Approve",
            cancelButtonLabel: "Cancel"
        }).then(
            function (result) {
                console.log("TMS: Approve dialog result - confirmed =", result.confirmed);
                if (!result.confirmed) { return; }
 
                if (!requiredFieldsFilled(formContext)) {
                    console.log("TMS: Approve blocked - required fields missing");
                    return;
                }
 
                formContext.getAttribute(F.APPROVAL).setValue(STATUS.APPROVED);
                updateDetails(formContext, "Approved_By", "Approved_Date");
                console.log("TMS: Approve - saving now");
                saveForm(formContext);
            },
            function (error) {
                console.log("TMS: Approve dialog FAILED -", error && error.message);
            }
        );
    }
 
    function reject(primaryControl) {
        console.log("TMS: Reject clicked");
        var formContext = primaryControl;
 
        Xrm.Navigation.openConfirmDialog({
            title: "Reject Wow Moment",
            text: "Are you sure you want to reject this Wow Moment?",
            confirmButtonLabel: "Reject",
            cancelButtonLabel: "Cancel"
        }).then(
            function (result) {
                console.log("TMS: Reject dialog result - confirmed =", result.confirmed);
                if (!result.confirmed) { return; }
 
                if (!requiredFieldsFilled(formContext)) {
                    console.log("TMS: Reject blocked - required fields missing");
                    return;
                }
 
                formContext.getAttribute(F.APPROVAL).setValue(STATUS.REJECTED);
                updateDetails(formContext, "Rejected_By", "Rejected_Date");
                console.log("TMS: Reject - saving now");
                saveForm(formContext);
            },
            function (error) {
                console.log("TMS: Reject dialog FAILED -", error && error.message);
            }
        );
    }
 
    // Used as an OnChange handler so buttons show/hide when fields change
    function refreshRibbon(executionContext) {
        console.log("TMS: refreshRibbon called");
        executionContext.getFormContext().ui.refreshRibbon();
    }
 
    return {
        canInitiate: canInitiate,
        canApprove: canApprove,
        canReject: canReject,
        initiate: initiate,
        approve: approve,
        reject: reject,
        refreshRibbon: refreshRibbon
    };
})();
 