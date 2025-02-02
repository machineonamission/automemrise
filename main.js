EventTarget.prototype.addEventListenerBase = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (type, listener) {
    if (type === "beforeunload")
        return; //ignore attempts to add a beforeunload event
    this.addEventListenerBase(type, listener); //treat all other events normally
};
$(window).off('beforeunload');

//chrome extension get
function chromeget(url, callback) {
    chrome.runtime.sendMessage({
        type: "request", options: {
            url: url
        }
    });
}


// main automemrise code

let redirecting = false; //stop the infiniteload glitch
function intervalclear() {
    var interval_id = window.setInterval("", 9999); // Get a reference to the last
    // interval +1
    for (var i = 1; i < interval_id; i++)
        window.clearInterval(i);
}


function getdef(word) {
    var dict1 = definitions[0];
    var dict2 = definitions[1];
    let ret = "";
    if (word in dict1) {
        ret = dict1[word];
    }
    if (word in dict2) {
        ret = dict2[word];
    }
    if (ret !== "") {
        return ret;
    } else {
        console.log("AM: definition error");
        console.log(word, [dict1, dict2]);
    }
}

//get garden state (presentation, multiple choice, etc)
function getgardenstate() {
    if (!$(".garden-box").length) {
        return "no-more-words"; // happens when atteempting to learn more words on an exhausted chapter
    }
    if ($(".js-toggle-silence").length) {
        return "audio";
    }
    var statelist = ["complete", "presentation", "multiple_choice", "typing", "end_of_session", "copytyping", "tapping", "video-pre-presentation", "audio-multiple-choice"];
    var stater = false;
    statelist.forEach(function (state) {
        var isstate = $(".garden-box").hasClass(state);
        if (isstate) {
            stater = state;
        }
    });
    return stater;
}

let sessionover = false;

function mainiter() { // one iteration of main "loop"
    if (!sessionover) {
        $(".qattributes").remove(); //qtext has the question and then this annoying ass div with noun info that fucks up my lookup
        //<div class="qtext">theanswer<div class="qattributes">useless shit</div></div>
        // looks like that, easiear to just remove it than do wack ass parsing shit
        switch (getgardenstate()) { //TODO: have it click next when erroring instead of sitting there like an idiot and maybe log something too
            case "no-more-words":
                sessionover = true;
                if (window.location.href.startsWith(course)) {
                    console.log("AM: stopping loop");
                    clearInterval(mainid); //kill the loop
                    chrome.storage.local.set({
                        "mode": "classic_review",
                    }, function () {
                        if (!redirecting) {
                            window.onbeforeunload = null;
                            setTimeout(function () {
                                window.location = course + chapter + "/garden/classic_review/";
                                window.onbeforeunload = null;
                            }, 1000);
                            redirecting = true;
                        }
                    });
                } else {
                    if (!redirecting) {
                        window.onbeforeunload = null;
                        setTimeout(function () {
                            window.location = course + chapter + "/garden/learn/";
                            window.onbeforeunload = null;
                        }, 1000);

                        redirecting = true;
                    }
                }

                break;
            case "complete":
            case "presentation":
                $(".next-icon").click();
                break;
            case "multiple_choice":
                var choices = [];
                $(".shiny-box").each(function () {
                    choices.push($(this).find(".val").text().trim());
                });
                var question = $(".qtext").text().trim();
                //alert(question);
                var ans = getdef(question, definitions);
                for (let i = 0; i < ans.length;) {
                    try {
                        var answer = choices.indexOf(ans[i]);
                        $(".shiny-box.choice")[answer].click();
                        i += 100;
                    } catch {
                        i++;
                    }
                }
                $(".next-button").click();
                break;
            case "typing":
                var question = $(".qtext").text().trim();
                var answer = getdef(question, definitions)[0];
                $(".typing-type-here").val(answer);
                $(".next-button").click();
                break;
            case "copytyping":
                var answer = $(".primary .row-value .primary-value").text().trim();
                $(".typing-type-here").val(answer);
                $(".next-button").click();
                break;
            case "audio-multiple-choice":
            case "audio":
                $(".js-toggle-silence").click();
                $(".btn-yes").click();
                $(".next-button").click();
                break;
            case "tapping":
                var question = $(".qtext").text().trim();
                var answers = getdef(question, definitions)[0].split(" ").filter(function (el) {
                    return el != null;
                });
                var answersprocessed = [];
                for (var i = 0; i < answers.length; i++) {
                    var splitt = answers[i].split(",");
                    for (var j = 0; j < splitt.length; j++) {
                        if (splitt[j] === "") {
                            splitt[j] = ",";
                        }
                        answersprocessed.push(splitt[j]);
                    }
                }
                var choices = [];
                $(".word-box-choice .word.btn").each(function () {
                    choices.push($(this).attr("data-word").trim());
                });
                answersprocessed.forEach(function (ans) {
                    var answer = choices.indexOf(ans);
                    $(".word-box-choice .word.btn")[answer].click();
                });
                $(".next-button").click();
                break;
            case "video-pre-presentation":
                var choices = [];
                $(".shiny-box").each(function () {
                    choices.push($(this).find(".val").text().trim());
                });
                var question = $(".hint-text").text().trim();
                //alert(question);
                var ans = getdef(question, definitions);
                for (let i = 0; i < ans.length;) {
                    try {
                        var answer = choices.indexOf(ans[i]);
                        $(".shiny-box.choice")[answer].click();
                        i += 100;
                    } catch {
                        i++;
                    }
                }
                $(".next-button").click();
                break;
            case "end_of_session":
                console.log("AM: stopping loop");
                clearInterval(mainid); //kill the loop
                sessionover = true;
                let pts = $(".final .pts").html();
                pts = pts.substring(0, pts.length - 4);
                pts = parseInt(pts);
                chrome.storage.local.get(["points"], function (resp) { //update points to not cause issues with multiple workers
                    //chrome.extension.getBackgroundPage().console.log(`points earned this session: ${pts}\ntotal points at beginning of session: {points}\npoints just grabbed: ${resp['points']}\npointsgoal: ${pointsgoal}`);
                    points = parseInt(resp["points"]);
                    if (pointsgoal < pts + points) {
                        chrome.storage.local.set({
                            "course": null,
                            "chapter": null,
                            "pointsgoal": null,
                            "points": null,
                            "definitions": null,
                            "memriseactive": false,
                            "mode": null
                        });
                        alert("Session completed.\n" + (pts + points) + " points earned.\nYou may now close the tab.");
                    } else {
                        chrome.storage.local.set({
                            "points": pts + points,
                        }, function () {
                            chrome.storage.local.get(["mode"], function (resp) {
                                if (!redirecting) {
                                    window.onbeforeunload = null;
                                    setTimeout(function () {
                                        window.location = course + chapter + "/garden/" + resp["mode"] + "/";
                                        window.onbeforeunload = null;
                                    }, 1000);
                                    redirecting = true;
                                }
                            });
                        });
                    }
                });
        }
    }
    window.onbeforeunload = null;

}

let definitions;
let mainid;

function main() {
    window.onbeforeunload = null;
    window.setInterval(function () {
        mainid = mainiter(definitions);
    }, 200);
}

// TODO: 1 word can have 2 definitions OUTSIDE OF THE FUCKING SWAP FUNCTION WTF TOSCANO
// TODO: doesn't find latus on chapter 12 owens
// TODO: owens chapter 7 word order broke
// TODO: memrise treats periods as a seperate word just like commas in word order questions, fix

// chrome extension code
let course, points, pointsgoal, chapter;
$(document).ready(function () {

    console.log("AM: load");
    chrome.storage.local.get(["course", "chapter", "pointsgoal", "points", "memriseactive", "definitions"], function (resp) {
        console.log("AM: storage");
        if (resp["memriseactive"]) {
            course = resp["course"];
            definitions = resp["definitions"];
            points = parseInt(resp["points"]);
            pointsgoal = parseInt(resp["pointsgoal"]);
            chapter = resp["chapter"];
            console.log("AM: ready and configured");
            setTimeout(function () {
                console.log("AM: starting");
                main();
            }, 2000); //give it time to load so it doesn't glitch out and go into review mode
        }
    });
});

