// setup
var apiCallCount = 0;
document.addEventListener('DOMContentLoaded', function () {
    updateApiCounter();
    loadMainCategories();
});
// helper functions
function updateApiCounter() {
    apiCallCount++;
    document.getElementById('apiCounter').textContent = "API calls: ".concat(apiCallCount);
}
function callApi(url) {
    updateApiCounter();
    return fetch(url)
        .then(function (response) {
        if (!response.ok)
            throw new Error('Network response was not ok');
        return response.json();
    });
}
function getCategoryMembers(categoryTitle) {
    var url = "https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=".concat(encodeURIComponent(categoryTitle), "&cmlimit=200&format=json&origin=*");
    return callApi(url);
}
// specific functions
function loadMainCategories() {
    loadColumn(1, 'Category:Main_topic_classifications');
    scrollToRight();
}
function loadColumn(columnIndex, chosen) {
    var column = document.getElementById("column".concat(columnIndex));
    var nextColumn = document.getElementById("column".concat(columnIndex + 1));
    // TODO: run this only once, but when data is about to be loaded into the column
    if (!nextColumn) {
        nextColumn = addColumn();
    }
    clearColumns(columnIndex + 1);
    var catList = column.querySelector('.categorieList');
    catList.innerHTML = '<li>Loading...</li>';
    var pageList = column.querySelector('.pagesList');
    pageList.innerHTML = '<li>Loading...</li>';
    if (chosen.startsWith('Category:')) {
        getCategoryMembers(chosen)
            .then(function (data) {
            catList.innerHTML = '';
            pageList.innerHTML = '';
            if (data.query && data.query.categorymembers) {
                var sorted = data.query.categorymembers.sort(function (a, b) { return a.title.localeCompare(b.title); });
                var categories = sorted.filter(function (cat) { return cat.title.startsWith('Category:'); });
                var pages = sorted.filter(function (cat) { return !cat.title.startsWith('Category:'); });
                if (categories.length === 0) {
                    column.querySelector(".categoriesTitle").textContent = "";
                    catList.innerHTML = '';
                }
                else {
                    column.querySelector(".categoriesTitle").textContent = "Categories (".concat(categories.length, ")");
                }
                if (pages.length === 0) {
                    column.querySelector(".pagesTitle").textContent = "";
                    pageList.innerHTML = '';
                }
                else {
                    column.querySelector(".pagesTitle").textContent = "Pages (".concat(pages.length, ")");
                }
                categories.forEach(function (cat) {
                    if (cat.title == ('Category:Main topic articles'))
                        return;
                    handleListItem(cat, true, columnIndex, catList, pageList, nextColumn);
                });
                pages.forEach(function (page) {
                    handleListItem(page, false, columnIndex, catList, pageList, nextColumn);
                });
            }
            else {
                catList.innerHTML = '<li>No categories found.</li>';
            }
        });
    }
    else {
        window.alert("Not implemented");
    }
}
function handleListItem(item, isCategory, columnIndex, catList, pageList, nextColumn) {
    var li = document.createElement('li');
    li.style.cursor = 'pointer';
    var nameSpan = document.createElement('span');
    var cleanTitle = isCategory ? item.title.replace('Category:', '') : item.title;
    nameSpan.textContent = cleanTitle;
    li.appendChild(nameSpan);
    li.onclick = function () {
        clearColumns(columnIndex + 1);
        Array.from(catList.children).forEach(function (child) { return child.classList.remove('selected'); });
        Array.from(pageList.children).forEach(function (child) { return child.classList.remove('selected'); });
        li.classList.add('selected');
        if (isCategory) {
            nextColumn.querySelector('.title').innerHTML = "<a href=\"https://en.wikipedia.org/wiki/".concat(encodeURIComponent(item.title), "\" target=\"_blank\">").concat(cleanTitle, "</a>");
            loadColumn(columnIndex + 1, item.title);
            scrollToRight();
        }
        else {
            nextColumn.querySelector('.title').innerHTML = "<a href=\"https://en.wikipedia.org/wiki/".concat(encodeURIComponent(item.title), "\" target=\"_blank\">").concat(item.title, "</a>");
            var url = "http://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=1&explaintext=1&pageids=".concat(item.pageid, "&format=json&origin=*");
            callApi(url)
                .then(function (data) {
                var extract = data.query.pages[item.pageid].extract || 'No extract available.';
                nextColumn.querySelector('.extract').textContent = extract;
                scrollToRight();
            });
        }
    };
    if (isCategory) {
        catList.appendChild(li);
    }
    else {
        pageList.appendChild(li);
    }
}
function scrollToRight() {
    document.getElementById('body').scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'end' });
}
function addColumn() {
    var columns = document.querySelectorAll('.column');
    var newColumnIndex = columns.length + 1;
    var newColumn = document.createElement('div');
    newColumn.id = "column".concat(newColumnIndex);
    newColumn.className = 'column';
    // should correspond with the HTML structure
    newColumn.innerHTML = "\n        <h2 class=\"title\"></h2>\n        <p class=\"extract\"></p>\n        <h3 class=\"categoriesTitle\"></h3>\n        <ul class=\"categorieList\"></ul>\n        <h3 class=\"pagesTitle\"></h3>\n        <ul class=\"pagesList\"></ul>\n    ";
    document.getElementById('columns').appendChild(newColumn);
    return document.getElementById("column".concat(newColumnIndex));
}
function clearColumns(startingIndex) {
    var column = document.getElementById("column".concat(startingIndex));
    if (column) {
        clearColumn(column);
        clearColumns(startingIndex + 1);
    }
}
function clearColumn(column) {
    column.querySelector('.title').textContent = '';
    column.querySelector('.extract').textContent = '';
    column.querySelector('.categoriesTitle').textContent = '';
    column.querySelector('.categorieList').innerHTML = '';
    column.querySelector('.pagesTitle').textContent = '';
    column.querySelector('.pagesList').innerHTML = '';
}
