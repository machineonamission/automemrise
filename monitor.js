function jsonget(url, callback) {
    $.ajax({
        dataType: "json",
        url: url,
        data: data,
        success: callback
    });
}

let courseid;

function main() {
    chrome.storage.local.get(["course", "chapter", "pointsgoal", "points", "memriseactive", "definitions", "courseid"], function (resp) {
        let active = resp["memriseactive"];
        let course = resp["course"];
        let points = parseInt(resp["points"]);
        let pointsgoal = parseInt(resp["pointsgoal"]);
        let chapter = resp["chapter"];
        courseid = resp["courseid"];
        let format;
        if (!active) {
            let percent = 0;
            format = `
        <p class=""><i class="fas fa-cogs"></i> Active?: ${active}</p>`
        } else {
            let percent = 100 * (points / pointsgoal);
            $(".pgr").css("width", percent + "%");
            format = `
        <p class=""><i class="fas fa-cogs"></i> Active?: ${active}</p>
        <p class="pfix"><i class="fab fa-discourse"></i> Course: ${course}</p>
        <p class=""><i class="fas fa-book"></i> Chapter: ${chapter}</p>
        <p class="pfix"><i class="far fa-star"></i> Current Points: ${points.toLocaleString()}</p>
        <p class="pfix"><i class="fas fa-star"></i> Points Goal: ${pointsgoal.toLocaleString()}</p>
        <p class=""><i class="fas fa-star-half-alt"></i> Percent complete: ${percent.toFixed(2)}%</p>
        `;
        }

        $(".main").html(format);
    });
}

const names = {
    "week": "<i class=\"fas fa-calendar-week\"></i> Week",
    "month": "<i class=\"fas fa-calendar-alt\"></i> Month",
    "alltime": "<i class=\"fas fa-calendar\"></i> All Time"
};

function leaderboard() {
    if (courseid) ["week", "month", "alltime"].forEach(function (period) {
        $.getJSON(`https://www.memrise.com/ajax/leaderboard/course/${courseid}/?period=${period}&how_many=1`, function (data) {
            let position = data.rows[0].position;
            let past = false;
            if (position > 100) {
                position = 100;
                past = true
            }
            $.getJSON(`https://www.memrise.com/ajax/leaderboard/course/${courseid}/?period=${period}&how_many=${position + 1}`, function (data) {
                let position1 = position - 1;
                let top;
                if (position1 !== 0) {
                    top = `#${data.rows[position1 - 1].position} ${data.rows[position1 - 1].username} ${data.rows[position1 - 1].points.toLocaleString()}`;
                } else {
                    top = ``;
                }
                let num1;
                if (position1 > 1) {
                    num1 = `#${data.rows[0].position} ${data.rows[0].username} ${data.rows[0].points.toLocaleString()}`;
                } else {
                    num1 = ``;
                }
                let num10;
                if (position1 > 10) {
                    num10 = `#${data.rows[9].position} ${data.rows[9].username} ${data.rows[9].points.toLocaleString()}`;
                } else {
                    num10 = ``;
                }
                let out = `
                <h3>${names[period]}</h3>
                <p class="pfix">${num1}</p>
                <p class="pfix">${num10}</p>
                <p class="pfix">${top}</p>
                <p class="pfix ${past ? '' : 'bold'}">#${data.rows[position1].position} ${data.rows[position1].username} ${data.rows[position1].points.toLocaleString()}</p>
                <p class="${past ? 'bold' : ''}">#${data.rows[position1 + 1].position} ${data.rows[position1 + 1].username} ${data.rows[position1 + 1].points.toLocaleString()}</p>
                `;
                $("#" + period).html(out);
            });
        });
    });

}

chrome.storage.onChanged.addListener(main);
main();
setInterval(leaderboard, 5000);
leaderboard();