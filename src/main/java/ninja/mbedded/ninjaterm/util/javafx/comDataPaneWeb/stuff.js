"use strict";

/// \brief      name is used purely for debugging purposes.
var name = "";
var isCaretShown = false;
var currColor = '#FFFFFF';

$( document ).ready(function() {
    console.log('doc ready');

    $("#down-arrow").click(function(){
        java.downArrowClicked();
    });

    // Notify the Java code if the mouse wheel is scrolled in
    // the upwards direction.
    $("#com-data-wrapper").bind('mousewheel', function(e) {
        if(e.originalEvent.wheelDelta > 0) {
            //java.log('up');
            java.upKeyOrMouseWheelUpOccurred();
        }
    });

    // Notify Java if the up key is pressed.
    // Note that this event handler won't work if it is just bound to the
    // $("#com-data-wrapper") node. For some reason it has to be applied the the
    // whole document
    $(document).on('keydown', function(e) {
        if (e.keyCode === 38) {
            //java.log('up key pressed');
            java.upKeyOrMouseWheelUpOccurred();
        }
    });


});

/*function handleScroll() {
    console.log("scroll() event handler called.");
    java.scrolled($("#com-data-wrapper").scrollTop());
}*/

function addText(newText) {
    java.log("addText() called for \"" + name + "\" with newText = \"" + newText + "\".");
    //java.log("com-data = " + JSON.stringify($("#com-data")));

    if(!newText) {
        return;
    }

    var lastChild;

    if(isCaretShown) {
        // If caret is shown, the caret if the last element,
        // the last textual data is the second-to-last element
        lastChild = $("#com-data").children().last().prev();
        if(!lastChild) {
            throw "Could not find child element to insert text into.";
        }
    } else {
        lastChild = $("#com-data").children().last();
        if(!lastChild) {
            throw "Could not find child element to insert text into.";
        }
    }

//    java.log("lastChild = \"" + JSON.stringify(lastChild) + "\".");
    java.log("lastChild.html() = \"" + lastChild.html() + "\".");

    //if (typeof lastChild.html() == 'undefined'){
    //    java.log("lastChild was 'undefined'");
    //    lastChild.html("");
    //}

    //java.log("lastChild (before 2) = \"" + lastChild.html() + "\".");

    //java.log("lastChild.html() (before add) = ");
    //java.log(lastChild.html());

    // Add text to this last span element
    // The span element should only contain text and new line characters,
    // and NO child HTML elements
    lastChild.html(lastChild.html() + newText);

    //java.log("lastChild (after) = " + lastChild.html());

    //java.log("lastChild.html() (after add) = ");
    //java.log(lastChild.html());
    //java.log("addText() finished.");
}

function addColor(color) {

    java.log("addColor() called for \"" + name + "\" with color = " + color);

    java.log("#com-data.html before addColor() = " + $("#com-data").html());

    var html = "<span style='color: " + color + ";'></span>";
    java.log("html to add = " + html);

    java.log('isCaretShown = ' + isCaretShown);

    if(isCaretShown) {
        // If the caret is shown, we have to insert this new color before
        // the caret node
        java.log('Inserting color span before caret...');
        $(html).insertBefore("#caret");

        // Set the caret color to be the same as the current text color
        $('#caret').css('color', color);
    } else {
        java.log('Appending color span to end of com-data object...');
        $("#com-data").append(html);
    }

    currColor = color;
    java.log("#com-data.html after addColor() = " + $("#com-data").html());
}

function appendTimeStamp(timeStamp) {
    java.log("appendTimeStamp called for \"" + name + "\" with timeStamp = " + timeStamp);

    var html = "<span style='color: white;'>" + timeStamp + "</span>";

    if(isCaretShown) {
        // If the caret is shown, we have to insert this new color before
        // the caret node
        $(html).insertBefore("#caret");
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
    java.log("clearData() called for \"" + name + "\".")
    java.log("#com-data.html before clearData() = " + $("#com-data").html());

    if(isCaretShown) {
        // Delete all child elements except for last (which is the caret)
        $("#com-data").children().not(":last").remove()
    } else {
        $("#com-data").empty();
    }

    java.log("#com-data.html after clearData() = " + $("#com-data").html());
}

function showDownArrow(trueFalse) {
    // Wrapped in jQuery ready() function because of weird asynchronicity bug
    // with Java WebView
    $(document).ready(function() {
        java.log("showDownArrow() called with trueFalse = " + trueFalse);
        if(trueFalse) {
            java.log("Showing down-arrow...");
            $("#down-arrow").show();
        } else {
            java.log("Hiding down-arrow...");
            $("#down-arrow").hide();
        }
    });
}

function getTextHeight() {
    //java.log("height = " + $("#com-data").height());
    return $("#com-data").height();
}

function setName(value) {
    // Wrapped in jQuery ready() function because of weird asynchronicity bug
    // with Java WebView
    //$(document).ready(function() {
        java.log("setName() called with value = " + value);
        $("#name-text").text(value);
        name = value;
    //});
}

//! @brief  Trims the oldest characters from the rich text object.
function trim(numChars) {

    java.log("trim() called for \"" + name + "\" with numChars = " + numChars);

    // Disable scroll handler, as trimming can cause this to fire when
    // we don't want it to
    //$("#com-data-wrapper").off('scroll', handleScroll);

    numCharsToRemove = numChars;

    // #com-data is a div
    $("#com-data").children().each(function(index, element) {

        //java.log("currChildNode = ");
        //java.log(JSON.stringify(element));

        text = $(element).text();
        //java.log("element.text() = ");
        //java.log(JSON.stringify(text));

        if(text.length > numCharsToRemove) {
            //java.log("element has enough text to satisfy trim() operation.");
            $(element).text(text.slice(numCharsToRemove));
            numCharsToRemove = 0;
            // We have remove enough chars, stop loop
            return false;
        } else {
            //java.log("element does not has enough text to satisfy trim() operation, removing and progressing through loop.");
            numCharsToRemove -= text.length;
            $(element).remove();

            if(numCharsToRemove == 0) {
                return false;
            }
        }

    });

    //$("#com-data-wrapper").on('scroll', handleScroll);

    if(numCharsToRemove > 0) {
        throw "trim() was requested to remove too many chars. Remaining chars to remove = " + numCharsToRemove;
    }

}

function showCaret(trueFalse) {

    java.log("showCaret() called for \"" + name + "\" with trueFalse = " + trueFalse);

    if(trueFalse == isCaretShown) {
        java.log("caret visibility is already in desired state, returning...");
        return;
    }

    // Wrapped in jQuery ready() function because of weird asynchronicity bug
    // with Java WebView
    //$(document).ready(function() {
        if(trueFalse) {
            // Create cursor
            java.log("Displaying caret...");
            //java.log("$('#com-data') (before adding caret) = " + JSON.stringify($("#com-data")));
            // &#x2588; is the hex code for the unicode character 'FULL BLOCK' (looks like a caret)
            $("#com-data").append('<span id="caret">&#x2588;</span>');
            //java.log("$('#com-data') (after adding caret) = " + JSON.stringify($("#com-data")));
            $('#caret').css('color', currColor);
            isCaretShown = true;
            java.log("#com-data.html = " + $("#com-data").html());

        } else {
            java.log("Hiding caret...");
            $("#caret").remove();
            isCaretShown = false;
            java.log("#com-data.html = " + $("#com-data").html());
        }
    //});
}

//! @brief      Checks the number of textual characters displayed as data is equal
//!             to what is expected. Mostly designed for debugging purposes, would be
//!             quite processor intensive to run all the time.
function checkCharCount(expectedCharCount) {

    charCount = 0;
    $("#com-data").children().each(function(index, element) {
        //java.log("html().length = " + $(element).html().length);
        charCount += $(element).html().length;
    });

    //java.log("charCount = " + charCount + ", expectedCharCount = " + expectedCharCount);
    if(charCount != expectedCharCount) {
        throw "Actual char count (" + charCount + ") did not match expected char count (" + expectedCharCount + ").";
    }

}




