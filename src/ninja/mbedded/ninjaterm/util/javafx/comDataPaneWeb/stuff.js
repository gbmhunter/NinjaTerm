


$( document ).ready(function() {
    console.log('doc ready');

    $("#com-data").scroll(function() { //.box is the class of the div
        //console.log("Scrolled!");
        java.scrolled();
    });
});

function addText(newText)
{
    console.log("addText() called with newText = " + newText);

    var innerHTML = $("#com-data").html();
    console.log("innerHTML (before add) = " + innerHTML);

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
    var objDiv = document.getElementById("com-data");
    objDiv.scrollTop = objDiv.scrollHeight;

}

