// Web API 2 - Update Events Counter on Shop form load
function updateEventsCounter(executionContext)
{
    var formContext = executionContext.getFormContext();

    // Run only for existing Shop records
    if (formContext.ui.getFormType() !== 2)
    {
        return;
    }

    var shopId =
        formContext.data.entity
                   .getId()
                   .replace("{", "")
                   .replace("}", "");

    Xrm.WebApi.retrieveMultipleRecords(
        "tms_wowmoment",
        "?$select=tms_wowmomentid&$filter=_tms_shop_value eq " + shopId
    ).then(
        function success(results)
        {
            var totalEvents =
                results.entities.length;

            var data =
            {
                tms_eventcounter: totalEvents
            };

            Xrm.WebApi.updateRecord(
                "tms_shop",
                shopId,
                data
            ).then(
                function success()
                {
                    formContext.data.refresh(false);
                },
                function(error)
                {
                    console.log(error.message);
                }
            );
        },
        function(error)
        {
            console.log(error.message);
        }
    );
}