// Validation 1 - Manage and Validate Feebdack Comments
function manageFeedbackComments(executionContext)
{
    var formContext = executionContext.getFormContext();

    var rating =
        formContext.getAttribute("tms_customerrating")
                   .getValue();

    var comments =
        formContext.getAttribute("tms_feedbackcomments");

    if (rating === 1 || rating === 2)
    {
        comments.setRequiredLevel("required");
    }
    else
    {
        comments.setRequiredLevel("none");
    }
}

function validateFeedbackComments(executionContext)
{
    var formContext = executionContext.getFormContext();

    var eventArgs =
        executionContext.getEventArgs();

    var rating =
        formContext.getAttribute("tms_customerrating")
                   .getValue();

    var comments =
        formContext.getAttribute("tms_feedbackcomments")
                   .getValue();

    if ((rating === 1 || rating === 2) && !comments)
    {
        eventArgs.preventDefault();

        formContext.ui.setFormNotification(
            "Feedback Comments are required when Customer Rating is 1 Star or 2 Star.",
            "ERROR",
            "feedbackValidation"
        );
    }
    else
    {
        formContext.ui.clearFormNotification(
            "feedbackValidation"
        );
    }
}

// Validation 2 - Manage and Validate Follow Up Remarks
function manageFollowUpRemarks(executionContext)
{
    var formContext = executionContext.getFormContext();

    var followUpRequired =
        formContext.getAttribute("tms_followuprequired")
                   .getValue();

    var remarksAttribute =
        formContext.getAttribute("tms_followupremarks");

    var remarksControl =
        formContext.getControl("tms_followupremarks");

    if (followUpRequired === true)
    {
        remarksControl.setVisible(true);

        remarksAttribute.setRequiredLevel("required");
    }
    else
    {
        remarksAttribute.setValue(null);

        remarksAttribute.setRequiredLevel("none");

        remarksControl.setVisible(false);
    }
}

function validateFollowUpRemarks(executionContext)
{
    var formContext = executionContext.getFormContext();

    var eventArgs =
        executionContext.getEventArgs();

    var followUpRequired =
        formContext.getAttribute("tms_followuprequired")
                   .getValue();

    var remarks =
        formContext.getAttribute("tms_followupremarks")
                   .getValue();


    if (followUpRequired === true && !remarks)
    {
        eventArgs.preventDefault();

        formContext.ui.setFormNotification(
            "Follow Up Remarks are required when Follow Up Required is set to Yes.",
            "ERROR",
            "followupValidation"
        );
    }
    else
    {
        formContext.ui.clearFormNotification(
            "followupValidation"
        );
    }
}