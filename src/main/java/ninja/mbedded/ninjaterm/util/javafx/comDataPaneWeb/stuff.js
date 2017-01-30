
isCaretShown = false;
currColor = '#FFFFFF';
var maxNumChars = 400;
var currNumChars = 0;

//! @brief      This enum should be identical to the same-named enum
//!             in ComDataPaneWeb.java.
var ScrollState = {
    "FIXED_TO_BOTTOM":  0,
    "SMART_SCROLL":     1 }

var scrollState = ScrollState.FIXED_TO_BOTTOM;

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

function setMaxNumChars(maxNumCharsIn) {

    java.log("setMaxNumChars() called.");

    maxNumChars = maxNumCharsIn;

    // If the buffer size is changed, we may need to trim the data
    // to fit the new size (if smaller)
    trimAndScroll();
}


function setScrollState(scrollStateIn) {
    scrollState = scrollStateIn;
}


function addText(newText) {
    //java.log("addText() called with newText = \"" + newText + "\".");
    //java.log("com-data = " + JSON.stringify($("#com-data")));

    if(!newText) {
        return;
    }

    if(isCaretShown) {
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


    // Add text to this last span element
    // The span element should only contain text and new line characters,
    // and NO child HTML elements
    lastChild.html(lastChild.html() + newText);

    currNumChars += newText.length;

}

function trimAndScroll() {

    //java.log("trimIfRequired() called.");

    var textHeightBeforeTrim = getTextHeight();

    if (currNumChars >= maxNumChars) {

        //logger.debug("Trimming data...");

        var numCharsToRemove = currNumChars - maxNumChars;
        //logger.debug("Need to trimIfRequired display text. currNumChars = " + currNumChars + ", numCharsToRemove = " + numCharsToRemove);

        trim(numCharsToRemove);

        // Update the character count
        currNumChars = currNumChars - numCharsToRemove;

        //logger.debug("currNumChars.get() = " + currNumChars.get());
    }

    var textHeightAfterTrim = getTextHeight();

    if(scrollState == ScrollState.FIXED_TO_BOTTOM) {
        scrollToBottom();
    } else if(scrollState == ScrollState.SMART_SCROLL) {

         var heightChange = textHeightBeforeTrim - textHeightAfterTrim;
         //logger.debug("heightChange = " + heightChange);

         // We need to shift the scroll up by the amount the height changed
         var oldScrollTop = getComDataWrapperScrollTop();
         //logger.debug("oldScrollTop = " + oldScrollTop);

         var newScrollTop = oldScrollTop - heightChange;

         // Scroll can't be less than 0
         if (newScrollTop < 0)
             newScrollTop = 0;
         //logger.debug("newScrollTop = " + newScrollTop);

         setComDataWrapperScrollTop(newScrollTop);
    } else {
        throw "scrollState enum value was not recognised.";
    }

}

function addColor(color) {

    //java.log("addColor() called with color = " + color);

    html = "<span style='color: " + color + ";'>";
    java.log("html = " + html);

    if(isCaretShown) {
        // If the caret is shown, we have to insert this new color before
        // the caret node
        $(html).insertBefore("#caret");

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
    java.log("clearData() called.")
    $("#com-data").empty();
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

function setName(name) {
    // Wrapped in jQuery ready() function because of weird asynchronicity bug
    // with Java WebView
    //$(document).ready(function() {
        java.log("setName() called with name = " + name);
        $("#name-text").text(name);
    //});
}

//! @brief  Trims the oldest characters from the rich text object.
function trim(numChars) {

    //java.log("trim() called.");

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
    // Wrapped in jQuery ready() function because of weird asynchronicity bug
    // with Java WebView
    $(document).ready(function() {
        if(trueFalse) {
            // Create cursor
            java.log("Displaying caret...");

            //java.log("$('#com-data') (before adding caret) = " + JSON.stringify($("#com-data")));
            // &#x2588; is the hex code for the unicode character 'FULL BLOCK' (looks like a caret)
            $("#com-data").append('<span id="caret">&#x2588;</span>');
            //java.log("$('#com-data') (after adding caret) = " + JSON.stringify($("#com-data")));

            $('#caret').css('color', currColor);

            isCaretShown = true;

        } else {
            java.log("Hiding caret...");

            $("#caret").remove();

            isCaretShown = false;
        }
    });
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




