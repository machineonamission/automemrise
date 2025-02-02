//swap dict
function listify(json) { // to be compatible with swap() function
    var ret = {};
    for (var key in json) {
        ret[key] = [json[key]];
    }
    return ret;
}

function swap(json) {
    //this is difficult to explain, but basically multiple words can have the same definition, so when swapping the dict instead of letting it overlap, i keep all overlapping values.
    //if ea, eae, and iI all equal they, it should return this:
    //they: ["ea", "eae", "iI"]
    var ret = {};
    for (var key in json) {
        if (!(json[key] in ret)) {
            ret[json[key]] = [key];
        } else {
            let val = ret[json[key]];
            val.push(key);
            ret[json[key]] = val;
        }

    }
    return ret;
}

function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    };
    xmlHttp.open("GET", theUrl, true); // true for alocalhronous
    xmlHttp.send(null);
}

function reset() {
    chrome.storage.local.set({
        "course": null,
        "chapter": null,
        "pointsgoal": null,
        "points": null,
        "definitions": null,
        "memriseactive": false,
        "mode": null,
        "courseid": null
    });
    window.close();
}

function start() {
    let course = $("#course").val();
    let chapter = $("#chapter").val();
    let points = $("#points").val();
    let workers = $("#workers").val();
    if (course.startsWith("https://www.memrise.com/course/") && course.endsWith("/") && !isNaN(chapter) && !isNaN(points)) {
        let newURL = `${course}${chapter}/garden/learn/`;
        httpGetAsync(course + chapter, function (data) {
            var definitions = {};
            var definitionpage = $(data);

            // get definitons for chapter

            $(definitionpage).find(".things .thing").each(function (index) {
                definitions[$(this).find(".col_a .text").text().trim()] = $(this).find(".col_b .text").text().trim();
            });
            var def1 = listify(definitions);
            var def2 = swap(definitions);
            definitions = [def1, def2];
            chrome.storage.local.set({
                "course": course,
                "chapter": chapter,
                "pointsgoal": points,
                "points": 0,
                "definitions": definitions,
                "memriseactive": true,
                "mode": "learn", //will switch to classic review once chapter is exausted
                "courseid": course.split("/")[4]
            });
            for (let i = 0; i < workers; i++) {
                chrome.tabs.create({url: newURL});
            }
            chrome.tabs.create({ url: "monitor.html" });
        });

    } else {
        alert("Input is invalid. Make sure you entered numbers and a valid memrise course URL.")
    }
    console.log(course, chapter, points);
}

$(document).ready(function () {
    $("#start")[0].onclick = start;
    $("#reset")[0].onclick = reset;
});
