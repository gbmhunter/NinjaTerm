
isCaretShown = false;
currColor = '#FFFFFF';

$( document ).ready(function() {
    console.log('doc ready');

    /*$("#com-data-wrapper").on('scroll', handleScroll);*/

    $("#down-arrow").click(function(){
        java.downArrowClicked();
    });

    $("#com-data-wrapper").bind('mousewheel', function(e) {
        if(e.originalEvent.wheelDelta > 0) {
            java.log('up');
            java.upKeyOrMouseWheelUpOccurred();
        } else {
            java.log('down');
        }
    });

    $(document).on('keydown', function(e) {
        //java.log('key down occured');
        if (e.keyCode === 38) {
            //java.log('up key pressed');
            java.upKeyOrMouseWheelUpOccurred();

        } else if (e.keyCode === 40) {
            //java.log('down key pressed');
        }
    });


});

function handleScroll() {
    console.log("scroll() event handler called.");
    java.scrolled($("#com-data-wrapper").scrollTop());
}

function addText(newText)
{
    java.log("addText() called with newText = " + newText);

    if(!newText)
        return;

    if(isCaretShown) {
        lastChild = $("#com-data").children().last().prev();
    } else {
        lastChild = $("#com-data").children().last();
    }

    java.log("lastChild = ")
    java.log(lastChild);


    java.log("lastChild.html() (before add) = ");
    java.log(lastChild.html());

    // Add text to this last span element
    lastChild.html(lastChild.html() + newText);

    java.log("lastChild.html() (after add) = ");
    java.log(lastChild.html());
}

function addColor(color) {

    java.log("addColor() called with color = " + color);

    html = "<span style='color: " + color + ";'>";
    java.log("html = " + html);

    if(isCaretShown) {
        // If the caret is shown, we have to insert this new color before
        // the caret node
        $(html).insertBefore("#caret")

        // Set the caret color to be the same as the current text color
        $('#caret').css('color', color);
    } else {
        $("#com-data").append(html);
    }

    currColor = color;
}

function appendTimeStamp(timeStamp) {
    java.log("appendTimeStamp called with timeStamp = " + timeStamp);

    html = "<span style='color: white;'>" + timeStamp + "</span>";

    if(isCaretShown) {
        // If the caret is shown, we have to insert this new color before
        // the caret node
        $(html).insertBefore("#caret")
    } else {
        $("#com-data").append(html);
    }

    // Go back to existing colour
    addColor(currColor);

}

function scrollToBottom() {

    //$("#com-data-wrapper").off('scroll', handleScroll);
    $("#com-data-wrapper").scrollTop($("#com-data").height()-$("#com-data-wrapper").height());
    //$("#com-data-wrapper").on('scroll', handleScroll);

//    $("#com-data-wrapper").animate({
//       scrollTop: $("#com-data").height()-$("#com-data-wrapper").height()},
//       1400,
//       "swing"
//    );

}

function getComDataWrapperScrollTop() {
    return $("#com-data-wrapper").scrollTop();
}

function setComDataWrapperScrollTop(scrollTop) {
    $("#com-data-wrapper").scrollTop(scrollTop);
}

function clearData() {
    $("#com-data").empty();
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

function getTextHeight() {
    java.log("height = " + $("#com-data").height());
    return $("#com-data").height();
}

function setName(name) {
    java.log("setName() called with name = " + name);
    $("#name-text").text(name);
}

//! @brief  Trims the oldest characters from the rich text object.
function trim(numChars) {

    // Disable scroll handler, as trimming can cause this to fire when
    // we don't want it to
    //$("#com-data-wrapper").off('scroll', handleScroll);

    numCharsToRemove = numChars;

    $("#com-data").children().each(function(index, element) {

        java.log("currChildNode = ")
        java.log(JSON.stringify(element));

        text = $(element).text();
        java.log("element.text() = ");
        java.log(JSON.stringify(text));

        if(text.length > numCharsToRemove) {
            java.log("element has enough text to satisfy trim() operation.");
            $(element).text(text.slice(numCharsToRemove));
            numCharsToRemove = 0;
            // We have remove enough chars, stop loop
            return false;
        } else {
            java.log("element does not has enough text to satisfy trim() operation, removing and progressing through loop.");
            numCharsToRemove -= text.length
            $(element).remove();

            if(numCharsToRemove == 0)
                return false;
        }

    });

    //$("#com-data-wrapper").on('scroll', handleScroll);

    if(numCharsToRemove > 0) {
        throw "trim() was requested to remove too many chars. Remaining chars to remove = " + numCharsToRemove;
    }

}

function showCaret(trueFalse) {
    if(trueFalse) {
        // Create cursor
        java.log("Displaying caret...");

//        java.log("$('#com-data') (before adding caret) = " + JSON.stringify($("#com-data")));
        $("#com-data").append('<span id="caret">█</span>');
//        java.log("$('#com-data') (after adding caret) = " + JSON.stringify($("#com-data")));

        $('#caret').css('color', currColor);

        isCaretShown = true;

    } else {
        java.log("Hiding caret...");

        $("#caret").remove();

        isCaretShown = false;
    }
}




