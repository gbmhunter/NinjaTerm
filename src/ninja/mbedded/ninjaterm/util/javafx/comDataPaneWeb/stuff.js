function addText(newText)
{
    console.log("addText() called with newText = " + newText);

    var innerHTML = document.getElementById("myspan").innerHTML;
    console.log("innerHTML (before add) = " + innerHTML);

    innerHTML = innerHTML.substr(0, innerHTML.length - 7) + newText + innerHTML.substr(innerHTML.length - 7);
    console.log("innerHTML (after add) = " + innerHTML);

    document.getElementById("myspan").innerHTML = innerHTML;
}

function addColor(color) {
html = "<span style='color: " + color + ";'>";
console.log(html);
document.getElementById("myspan").innerHTML = document.getElementById("myspan").innerHTML + html;
console.log("innerHTML = " + document.getElementById("myspan").innerHTML);
}

console.log("test")