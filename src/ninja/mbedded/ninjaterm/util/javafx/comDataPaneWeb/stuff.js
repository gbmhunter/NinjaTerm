


$( document ).ready(function() {
    console.log('doc ready');

    $("#com-data-wrapper").scroll(function() {
        //console.log("Scrolled!");
        java.scrolled($("#com-data-wrapper").scrollTop());
    });

    $("#down-arrow").click(function(){
        java.downArrowClicked();
    });
});

function addText(newText)
{
    console.log("addText() called with newText = " + newText);

    if(!newText)
        return;

    var innerHTML = $("#com-data").html();
    console.log("innerHTML (before add) = " + innerHTML);

    // Insert before the last </span>
    innerHTML = innerHTML.substr(0, innerHTML.length - 7) + newText + innerHTML.substr(innerHTML.length - 7);
    console.log("innerHTML (after add) = " + innerHTML);

    document.getElementById("com-data").innerHTML = innerHTML;
}

function addColor(color) {
    html = "<span style='color: " + color + ";'>";
    console.log("html = " + html);
    document.getElementById("com-data").innerHTML = document.getElementById("com-data").innerHTML + html;
    console.log("innerHTML = " + document.getElementById("com-data").innerHTML);
}

function scrollToBottom() {
    /*var objDiv = $("com-data");
    objDiv.scrollTop = objDiv.scrollHeight;*/

    $("#com-data-wrapper").scrollTop($("#com-data").height()-$("#com-data-wrapper").height());

//    $("#com-data-wrapper").animate({
//       scrollTop: $("#com-data").height()-$("#com-data-wrapper").height()},
//       1400,
//       "swing"
//    );

}

function showDownArrow(trueFalse) {
    java.log("showDownArrow() called with trueFalse = " + trueFalse);
    if(trueFalse) {
        java.log("Showing down-arrow...");
        $("#down-arrow").show();
    } else {
        java.log("Hiding down-arrow...");
        $("#down-arrow").hide();
    }
}

