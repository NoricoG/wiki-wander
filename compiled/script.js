var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// type definitions
// setup
var localeOptions = [
    {
        name: 'English',
        apiUrl: 'https://en.wikipedia.org/w/api.php',
        pageUrl: 'https://en.wikipedia.org/wiki/',
        startingCategory: 'Category:Main_topic_classifications',
        excludeItems: ['Category:Main topic classifications'],
        categoryPrefix: 'Category'
    },
    {
        name: 'Simple English',
        apiUrl: 'https://simple.wikipedia.org/w/api.php',
        pageUrl: 'https://simple.wikipedia.org/wiki/',
        startingCategory: 'Category:Contents',
        excludeItems: [],
        categoryPrefix: 'Category'
    },
    {
        name: 'Nederlands',
        apiUrl: 'https://nl.wikipedia.org/w/api.php',
        pageUrl: 'https://nl.wikipedia.org/wiki/',
        startingCategory: 'Categorie:Alles',
        excludeItems: ['Hoofdpagina'],
        categoryPrefix: 'Categorie'
    },
    {
        name: 'Deutsch',
        apiUrl: 'https://de.wikipedia.org/w/api.php',
        pageUrl: 'https://de.wikipedia.org/wiki/',
        startingCategory: 'Kategorie:Sachsystematik',
        excludeItems: [],
        categoryPrefix: 'Kategorie'
    }
];
var locale = localeOptions[0];
var apiCallCount = 0;
var apiPageLimit = 200;
var apiDefaultParams = {
    format: 'json',
    origin: '*'
};
document.addEventListener('DOMContentLoaded', function () {
    createLocalePicker();
    updateApiCounter();
    loadMainCategories();
});
// helper functions
function updateApiCounter() {
    apiCallCount++;
    document.getElementById('apiCounter').textContent = "API calls: ".concat(apiCallCount);
}
function callApi(params) {
    return __awaiter(this, void 0, void 0, function () {
        var url, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    updateApiCounter();
                    url = new URL(locale.apiUrl);
                    Object.keys(params).forEach(function (key) { return url.searchParams.append(key, params[key]); });
                    Object.keys(apiDefaultParams).forEach(function (key) { return url.searchParams.append(key, apiDefaultParams[key]); });
                    return [4 /*yield*/, fetch(url.toString())];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Network response was not ok');
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function pageJsonToItem(data) {
    var split = data.title.split(':');
    var cleanTitle = split.length == 2 ? split[1] : data.title;
    var type = split.length == 2 ? split[0] : 'Page';
    if (type == locale.categoryPrefix) {
        type = 'Category';
    }
    var extract = data.extract || '';
    return {
        type: type,
        pageid: data.pageid,
        ns: data.ns,
        cleanTitle: cleanTitle,
        fullTitle: data.title,
        extract: extract,
    };
}
function getCategoryMembers(categoryTitle) {
    // sandbox https://en.wikipedia.org/wiki/Special:ApiSandbox#action=query&list=categorymembers&cmtitle={categoryTitle}&cmlimit=200&format=json&origin=*
    return callApi({
        action: 'query',
        list: 'categorymembers',
        cmtitle: categoryTitle,
        cmlimit: '200',
    }).then(function (data) {
        if (!data.query || !data.query.categorymembers) {
            return [];
        }
        else {
            return data.query.categorymembers.map(function (item) { return pageJsonToItem(item); });
        }
    });
}
function getMatchingPage(item) {
    if (item.type != 'Category') {
        console.log('Matching page can only be retrieved for a Category');
        return Promise.resolve(null);
    }
    // sandbox https://en.wikipedia.org/wiki/Special:ApiSandbox#action=query&titles={item.cleanTitle}&redirects=1&prop=extracts&exsentences=1&explaintext=1&list=search&srsearch={item.cleanTitle}&srlimit=1
    return callApi({
        action: 'query',
        //extract
        titles: item.cleanTitle,
        redirects: '1',
        prop: 'extracts',
        exsentences: '1',
        explaintext: 'true',
        // word count
        list: 'search',
        srsearch: item.cleanTitle,
        srlimit: '1',
    }).then(function (data) {
        var _a, _b;
        var pages = (_a = data.query) === null || _a === void 0 ? void 0 : _a.pages;
        if (pages && Object.keys(pages).length === 1) {
            var newItemKey = Object.keys(pages)[0];
            if (newItemKey == '-1') {
                return null;
            }
            var newItem = pageJsonToItem(pages[newItemKey]);
            if (newItem.type != 'Page') {
                return null;
            }
            var search = (_b = data.query) === null || _b === void 0 ? void 0 : _b.search;
            if (search) {
                newItem.wordCount = search[0].wordcount || null;
            }
            return newItem;
        }
        return null;
    });
}
function enrichPageData(item) {
    // sandbox https://en.wikipedia.org/wiki/Special:ApiSandbox#action=query&pageids={pageId}&prop=extracts&exsentences=2&explaintext=1&list=search&srsearch={item.fullTitle}&srlimit=1&format=json&origin=*
    return callApi({
        action: 'query',
        // extract
        pageids: item.pageid.toString(),
        prop: 'extracts',
        exsentences: '1',
        explaintext: '1',
        // word count
        list: 'search',
        srsearch: item.fullTitle,
        srlimit: '1',
    }).then(function (data) {
        item.extract = data.query.pages[item.pageid].extract || '';
        if (data.query.search) {
            item.wordCount = data.query.search[0].wordcount || null;
        }
        return item;
    });
}
// specific functions
function loadMainCategories() {
    loadColumn(1, { pageid: -1, ns: -1, cleanTitle: 'Categories', fullTitle: locale.startingCategory, type: 'Category' });
    scrollToRight();
}
function loadColumn(columnIndex, item) {
    document.getElementById("column".concat(columnIndex)).querySelector('.columnTitle').textContent = item.cleanTitle;
    switch (item.type) {
        case 'Category':
            _loadCatColumn(columnIndex, item);
            break;
        case 'Page':
            _loadPageColumn(columnIndex, item);
            break;
        default:
            console.error('Unknown item type:', item.type);
    }
    scrollToRight();
}
function _loadCatColumn(columnIndex, item) {
    var column = document.getElementById("column".concat(columnIndex));
    getMatchingPage(item).then(function (matchingPage) {
        if (matchingPage) {
            var pageExtract = document.createElement('p');
            pageExtract.className = 'extract';
            pageExtract.textContent = matchingPage.extract;
            column.querySelector('.details').appendChild(pageExtract);
        }
        var catLink = document.createElement('a');
        catLink.href = "".concat(locale.pageUrl).concat(encodeURIComponent(item.fullTitle));
        catLink.target = '_blank';
        catLink.textContent = "Category";
        column.querySelector('.details').appendChild(catLink);
        if (matchingPage) {
            var pageLink = document.createElement('a');
            pageLink.href = "".concat(locale.pageUrl).concat(encodeURIComponent(matchingPage.fullTitle));
            pageLink.target = '_blank';
            pageLink.textContent = "Page";
            column.querySelector('.details').appendChild(pageLink);
            console.log("Aadslkjfhasd;klfhasdf;hklasdf;hjkl" + matchingPage.wordCount);
            showWordCount(column, matchingPage.wordCount);
        }
    });
    var catList = column.querySelector('.categorieList');
    catList.innerHTML = '<li>Loading...</li>';
    var pageList = column.querySelector('.pagesList');
    pageList.innerHTML = '<li>Loading...</li>';
    getCategoryMembers(item.fullTitle)
        .then(function (items) {
        catList.innerHTML = '';
        pageList.innerHTML = '';
        if (items.length > 0) {
            var sorted = items.sort(function (a, b) { return a.cleanTitle.localeCompare(b.cleanTitle); }).filter(function (cat) { return !locale.excludeItems.includes(cat.cleanTitle); });
            var categories = sorted.filter(function (cat) { return cat.fullTitle.startsWith(locale.categoryPrefix); });
            var pages = sorted.filter(function (cat) { return !cat.fullTitle.startsWith(locale.categoryPrefix); });
            var categoriesTitle = '';
            if (categories.length === apiPageLimit) {
                categoriesTitle = "Categories (".concat(apiPageLimit, ")+");
            }
            else if (categories.length > 0) {
                categoriesTitle = "Categories (".concat(categories.length, ")");
            }
            var pagesTitle = '';
            if (pages.length === apiPageLimit) {
                pagesTitle = "Pages (".concat(apiPageLimit, ")+");
            }
            else if (pages.length > 0) {
                pagesTitle = "Pages (".concat(pages.length, ")");
            }
            column.querySelector(".categoriesTitle").textContent = categoriesTitle;
            column.querySelector(".pagesTitle").textContent = pagesTitle;
            catList.innerHTML = '';
            pageList.innerHTML = '';
            categories.forEach(function (cat) {
                handleListItem(cat, columnIndex, catList);
            });
            pages.forEach(function (page) {
                handleListItem(page, columnIndex, pageList);
            });
        }
        else {
            catList.innerHTML = '<li>No categories found.</li>';
        }
    });
    var nextColumn = document.getElementById("column".concat(columnIndex + 1));
    // TODO: run this only once, but when data is about to be loaded into the column
    if (!nextColumn) {
        nextColumn = addColumn();
    }
    clearColumns(columnIndex + 1);
}
function _loadPageColumn(columnIndex, item) {
    var column = document.getElementById("column".concat(columnIndex));
    column.querySelector('.details').innerHTML = '';
    var extractElement = document.createElement('p');
    extractElement.className = 'extract';
    extractElement.textContent = 'Loading...';
    column.querySelector('.details').appendChild(extractElement);
    var pageLink = document.createElement('a');
    pageLink.href = "".concat(locale.pageUrl).concat(encodeURIComponent(item.fullTitle));
    pageLink.target = '_blank';
    pageLink.textContent = "Page";
    column.querySelector('.details').appendChild(pageLink);
    enrichPageData(item)
        .then(function (updatedItem) {
        var extract = updatedItem.extract || 'No extract available.';
        extractElement.textContent = extract;
        showWordCount(column, updatedItem.wordCount);
    });
}
function showWordCount(column, wordCount) {
    if (wordCount) {
        var readingSpeed = parseInt(document.getElementById('readingSpeed').value);
        var time = (wordCount / readingSpeed).toFixed(1);
        var wordCountElement = document.createElement('p');
        wordCountElement.className = 'wordCount';
        wordCountElement.textContent = "".concat(wordCount, " words (").concat(time, " minutes)");
        column.querySelector('.details').appendChild(wordCountElement);
    }
}
function handleListItem(item, columnIndex, list) {
    var li = document.createElement('li');
    var nameSpan = document.createElement('span');
    nameSpan.textContent = item.cleanTitle;
    li.appendChild(nameSpan);
    li.onclick = function () {
        removeSelection(columnIndex);
        li.classList.add('selected');
        clearColumns(columnIndex + 1);
        loadColumn(columnIndex + 1, item);
    };
    list.appendChild(li);
}
function createLocalePicker() {
    var langSelector = document.getElementById('langSelector');
    localeOptions.forEach(function (loc, idx) {
        var option = document.createElement('option');
        option.value = idx.toString();
        option.textContent = loc.name;
        if (idx === 0)
            option.selected = true;
        langSelector.appendChild(option);
    });
    langSelector.addEventListener('change', function () {
        locale = localeOptions[parseInt(langSelector.value)];
        clearColumns(1);
        loadMainCategories();
    });
}
function removeSelection(columnIndex) {
    var column = document.getElementById("column".concat(columnIndex));
    if (!column)
        return;
    var catList = column.querySelector('.categorieList');
    var pageList = column.querySelector('.pagesList');
    Array.from(catList.children).forEach(function (child) { return child.classList.remove('selected'); });
    Array.from(pageList.children).forEach(function (child) { return child.classList.remove('selected'); });
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
    newColumn.innerHTML = "\n        <h2 class=\"columnTitle\"></h2>\n        <div class=\"details\"></div>\n        <h3 class=\"categoriesTitle\"></h3>\n        <ul class=\"categorieList\"></ul>\n        <h3 class=\"pagesTitle\"></h3>\n        <ul class=\"pagesList\"></ul>\n    ";
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
    column.querySelector('.columnTitle').textContent = '';
    column.querySelector('.details').innerHTML = '';
    column.querySelector('.categoriesTitle').textContent = '';
    column.querySelector('.categorieList').innerHTML = '';
    column.querySelector('.pagesTitle').textContent = '';
    column.querySelector('.pagesList').innerHTML = '';
}
