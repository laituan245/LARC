$(window).on('load', function () {
    const { task } = parseUrl(window.location.search);

    load_new_task(task);
    use_user_preferences();

    // show layout if first time visiting
    if (localStorage.getItem('visited_overview') != 'true') {
        setTimeout(() => {
            start_walkthrough();
        }, 1000);
        localStorage.setItem('visited_overview', 'true');
    }
});

/**
 * Handle back and forth navigation
 * from https://stackoverflow.com/a/3354511/5416200 (but url stored in query params)
 * @param {Object} e the event that carries the 
 */
window.onpopstate = function(e){
    if(e.state){
        load_new_task(e.state.task);
        document.title = e.state.pageTitle;
    }
};

/**
 * Parses the url to get the task number
 * @param {string} url 
 */
function parseUrl(url) {
    const urlParams = new URLSearchParams(url);

    // if url does not contain both arguments, update url to contain them
    let url_info = {};
    let task = urlParams.get('task');

    if (!task) {
        task = TASKS[Math.floor(Math.random()*NUM_TASKS)];
        url_info['task'] = task;
    }

    if (!$.isEmptyObject(url_info)) {
        updateUrl(url_info);
    }
    return { "task": task };
}

/**
 * update the url so that the url can be shared to show same information
 * https://stackoverflow.com/a/41542008/5416200
 * @param {Object} response the data that updates the url {task: *task*}
 */
function updateUrl(response) {
    if ('URLSearchParams' in window) {
        var searchParams = new URLSearchParams(window.location.search);
        searchParams.set("task", response.task);

        console.log(response);

        var newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
        document.title = "ARC Data: " + response.task.toString();

        load_new_task(response.task);

        window.history.pushState({"task": response.task, "pageTitle": document.title}, "", newRelativePathQuery);
    }
}

/**
 * load a new task after user selects it
 * @param {number} task the task to load
 */
function load_new_task(task) {

    loadTask(task).then(() => {
        $(".test-io").empty();
        fill_div_with_IO($("#test-io"), TEST_PAIR.input, TEST_PAIR.output);
        fill_div_with_IO($("#test-io-preview"), TEST_PAIR.input, TEST_PAIR.output);
        $('.pair_preview').addClass('neumorphic');

        $(".neumorphic").on('click', zoom_on_div);
    });

    TASK_ID = task;
    $("#task-title").text(`Task ${task}`);
    get_task_descriptions(task).then(function (descriptions) {

        function sortBy(field, reverse=false) {
            return function(a, b) {
              if (a[field] > b[field]) {
                return reverse ? -1 : 1;
              } else if (a[field] < b[field]) {
                return reverse ? 1 : -1;
              }
              return 0;
            };
        }

        function sortByTimestamp(reverse=false) {
            return function(a, b) {
                if (a['timestamp']['seconds'] > b['timestamp']['seconds']) {
                  return reverse ? -1 : 1;
                } else if (a['timestamp']['seconds'] < b['timestamp']['seconds']) {
                  return reverse ? 1 : -1;
                }
                return 0;
              };
        }

        descriptions.sort(sortBy('bandit_success_score', reverse=true));

        PAST_DESCS = descriptions;
        createDescsPager(descriptions);

        // summarize_descriptions(descriptions);

    }).catch(error => {
        errorMsg("Failed to load past task descriptions. Please ensure your internet connection, and retry. If the issue persists, please email [anonymous author]@[anonymous institution].edu");
        console.error(error);
    });
}

// ====
// Stat charts
// ====

function merge_word_counts(word_count_1, word_count_2) {
    let wc = object_copy(word_count_1);
    $.each(word_count_2, (key, count) => {
        if (key in wc) {
            wc[key] += count;
        } else {
            wc[key] = count;
        }
    });
    return wc;
}

function summarize_descriptions(descriptions) {
    $("#desc-count").text("Descriptions count: " + descriptions.length.toString());

    // most common unigrams
    let see_desc_word_count = {};
    let grid_word_count = {};
    let do_desc_word_count = {};

    $.each(descriptions, (i, desc) => {
        const see_desc_no_prefix = desc.see_description.replace(SHOULD_SEE_PREFIX, '');
        see_desc_word_count = merge_word_counts(see_desc_word_count, get_word_counts(see_desc_no_prefix));

        const grid_desc_no_prefix = desc.grid_description.replace(GRID_SIZE_PREFIX, '');
        grid_word_count = merge_word_counts(grid_word_count, get_word_counts(grid_desc_no_prefix));

        const do_desc_no_prefix = desc.do_description.replace(HAVE_TO_PREFIX, '');
        do_desc_word_count = merge_word_counts(do_desc_word_count, get_word_counts(do_desc_no_prefix));
    });

    const most_common_see = get_n_highest_frequency(see_desc_word_count);
    const most_common_grid = get_n_highest_frequency(grid_word_count);
    const most_common_do = get_n_highest_frequency(do_desc_word_count);

    create_word_count_graph('see-desc-wc-chart', most_common_see, "Most Common Words Describing Input");
    create_word_count_graph('do-desc-wc-chart', most_common_do, "Most Common Words Describing Transformation");
    create_desc_success_bar(descriptions);

}

function create_word_count_graph(canvas_id, word_count, graph_title) {

    // to remove listeners (https://stackoverflow.com/a/45342629/5416200)
    const parent = $("#" + canvas_id).parent();
    $("#" + canvas_id).remove();
    parent.append($('<canvas class="chart" id="' + canvas_id + '"></canvas>'));

    var ctx = document.getElementById(canvas_id).getContext('2d');

    let labels = word_count.map(x => x[0]);
    let data_points = word_count.map(x => x[1]);

    let data = {
        labels: labels,
        datasets: [{
            label: 'frequency',
            backgroundColor: '#83aee9',
            borderColor: '#83aee9',
            data: data_points,
        }]
    };
    let options = {
        title: {
            display: true,
            text: graph_title
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    callback: function(value, index, values) {
                        // remove all decimal tick values
                        if (Math.floor(value) === value) {
                            return value;
                        }
                    }
                }
            }]
        },
        legend: {
            display: false
         },
    };

    new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options
    });
}

function create_desc_success_bar(descs) {

    // to remove listeners (https://stackoverflow.com/a/45342629/5416200)
    const parent = $("#desc-success-chart").parent();
    $("#desc-success-chart").remove();
    parent.append($('<canvas class="chart" id="desc-success-chart"></canvas>'));

    var ctx = document.getElementById('desc-success-chart').getContext('2d');

    let labels = [];
    let data_points = [];

    $.each(descs, (i, desc) => {
        labels.push("Description " + i.toString());
        data_points.push(desc.display_num_success / desc.display_num_attempts);
    });

    let data = {
        labels: labels,
        datasets: [{
            label: '3 attempts',
            backgroundColor: '#83aee9',
            borderColor: '#83aee9',
            data: data_points,
            suggestedMax: 1,
        }]
    };
    let options = {
        title: {
            display: true,
            text: 'Communication Success Ratio'
        },
        scales: {
            xAxes: [{
                ticks: {
                    suggestedMin: 0,
                    suggestedMax: 1
                }
            }]
        },
        legend: {
            display: false
         },
    };

     new Chart(ctx, {
        type: 'horizontalBar',
        data: data,
        options: options
    });
}

function get_n_highest_frequency(word_count, n=5) {
    let word_count_array = [];

    $.each(word_count, (word, count) => {
        word_count_array.push([word, count]);
    });

    word_count_array.sort((a, b) => { return b[1] - a[1] });
    return word_count_array.slice(0, n);
}

function get_word_counts(str) {
    let word_counts = {};
    const stop_words = ["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"];

    let words = str.replace("'", '').match(/(\w+)/g);

    $.each(words, (_, word) => {
        let stripped_word = word.replace(/[^0-9a-z]/gi, '').toLowerCase();

        if (stripped_word.length > 0) {
            if (stripped_word in word_counts) {
                word_counts[stripped_word] += 1;
            } else {
                word_counts[stripped_word] = 1;
            }
        }
    });

    $.each(stop_words, (_, word) => {
        delete word_counts[word];
    });

    return word_counts;
}



/**
 * Create an href on the left for each task description
 * @param {[Objects]} descriptions an array of all description objects
 */
function createDescsPager(descriptions) {
    $("#descriptions-pager").empty();
    $.each(descriptions, (i, desc) => {
        let row = $(`<a class="list-group-item list-group-item-action neumorphic-list-item" data-toggle="list" role="tab" 
            href="description.html?task=${TASK_ID}&id=${desc.id}">Description ${i+1}</a>`);
        $("#descriptions-pager").append(row);
    });

    $('#descriptions-pager a').click(function(){
        document.location.href = $(this).attr('href');
    });
}
