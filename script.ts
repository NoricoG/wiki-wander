// type definitions

interface Locale {
    name: string;
    apiUrl: string;
    pageUrl: string;
    startingCategory: string;
    excludeItems: string[];
    categoryPrefix: string;
}

interface Item {
    type: string; // Category, Page or something else
    pageid: number;
    ns: number;
    cleanTitle: string;
    fullTitle: string;
    extract?: string;
}

// setup

let localeOptions: Locale[] = [
    {
        name: 'English (Main Classifications)',
        apiUrl: 'https://en.wikipedia.org/w/api.php',
        pageUrl: 'https://en.wikipedia.org/wiki/',
        startingCategory: 'Category:Main_topic_classifications',
        excludeItems: ['Category:Main topic classifications'],
        categoryPrefix: 'Category'
    },
    {
        name: 'English (Contents)',
        apiUrl: 'https://en.wikipedia.org/w/api.php',
        pageUrl: 'https://en.wikipedia.org/wiki/',
        startingCategory: 'Category:Contents',
        excludeItems: [],
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
        startingCategory: 'Kategorie:!Hauptkategorie',
        excludeItems: [],
        categoryPrefix: 'Kategorie'
    }

];
let locale: Locale = localeOptions[0];
let apiCallCount: number = 0;
let apiPageLimit: number = 200;
const apiDefaultParams = {
    format: 'json',
    origin: '*'
};

document.addEventListener('DOMContentLoaded', () => {
    createLocalePicker();
    updateApiCounter();
    loadMainCategories();
});

// helper functions

function updateApiCounter(): void {
    apiCallCount++;
    (document.getElementById('apiCounter') as HTMLElement).textContent = `API calls: ${apiCallCount}`;
}

async function callApi(params: Record<string, string>): Promise<any> {
    updateApiCounter();
    const url = new URL(locale.apiUrl);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    Object.keys(apiDefaultParams).forEach(key => url.searchParams.append(key, apiDefaultParams[key]));
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
}

function ItemJsonToItem(data: any): Item {
    const split = data.title.split(':');
    const cleanTitle = split.length == 2 ? split[1] : data.title;
    let type = split.length == 2 ? split[0] : 'Page';
    if (type == locale.categoryPrefix) {
        type = 'Category';
    }
    const extract = data.extract || '';
    return {
        type: type,
        pageid: data.pageid,
        ns: data.ns,
        cleanTitle: cleanTitle,
        fullTitle: data.title,
        extract: extract,

    };
}

function getCategoryMembers(categoryTitle: string): Promise<any> {
    // sandbox https://en.wikipedia.org/wiki/Special:ApiSandbox#action=query&list=categorymembers&cmtitle={categoryTitle}&cmlimit=200&format=json&origin=*
    return callApi({
        action: 'query',
        list: 'categorymembers',
        cmtitle: categoryTitle,
        cmlimit: '200',
    }).then((data: any) => {
        if (!data.query || !data.query.categorymembers) {
            return [];
        } else {
            return data.query.categorymembers.map((item: any) => ItemJsonToItem(item));
        }
    });
}

function getPageData(pageId: number): Promise<any> {
    // sandbox https://en.wikipedia.org/wiki/Special:ApiSandbox#action=query&prop=extracts&exsentences=1&explaintext=1&pageids={pageId}&format=json&origin=*
    return callApi({
        action: 'query',
        prop: 'extracts',
        exsentences: '1',
        explaintext: '1',
        pageids: pageId.toString(),
    });
}

function getMatchingPage(item: Item): Promise<Item | null> {
    // sandbox https://en.wikipedia.org/wiki/Special:ApiSandbox#action=query&format=json&prop=extracts&titles={item.cleanTitle}&exintro=true&explaintext=true&redirects=1
    return callApi({
            action: 'query',
            format: 'json',
            prop: 'extracts',
            titles: item.cleanTitle,
            exsentences: '1',
            explaintext: 'true',
            redirects: '1',
        }).then((data: any) => {
            if (data.query && data.query.pages && Object.keys(data.query.pages).length === 1) {
                const newItemKey = Object.keys(data.query.pages)[0];
                if (newItemKey == '-1') {
                    return null;
                }
                const newItem = ItemJsonToItem(data.query.pages[newItemKey]);
                if (newItem.type == 'Page') {
                    return newItem;
                }
            }
            return null;
    });
}

// specific functions

function loadMainCategories(): void {
    loadColumn(1, { pageid: -1, ns: -1, cleanTitle: 'Categories', fullTitle: locale.startingCategory, type: 'Category' });
    scrollToRight();
}

function loadColumn(columnIndex: number, item: Item): void {
    document.getElementById(`column${columnIndex}`).querySelector('.columnTitle')!.textContent = item.cleanTitle;
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

function _loadCatColumn(columnIndex: number, item: Item): void {
    const column = document.getElementById(`column${columnIndex}`) as HTMLElement;

    getMatchingPage(item).then((matchingPage: Item | null) => {
        if (matchingPage) {
            const pageExtract = document.createElement('p');
            pageExtract.className = 'extract';
            pageExtract.textContent = matchingPage.extract;
            column.querySelector('.details')!.appendChild(pageExtract);
        }

        const catLink = document.createElement('a');
        catLink.href = `${locale.pageUrl}${encodeURIComponent(item.fullTitle)}`;
        catLink.target = '_blank';
        catLink.textContent = "Category";
        column.querySelector('.details')!.appendChild(catLink);

        if (matchingPage) {
            const pageLink = document.createElement('a');
            pageLink.href = `${locale.pageUrl}${encodeURIComponent(matchingPage.fullTitle)}`;
            pageLink.target = '_blank';
            pageLink.textContent = "Page";
            column.querySelector('.details')!.appendChild(pageLink);
        }
    });

    const catList = column.querySelector('.categorieList') as HTMLUListElement;
    catList.innerHTML = '<li>Loading...</li>';
    const pageList = column.querySelector('.pagesList') as HTMLUListElement;
    pageList.innerHTML = '<li>Loading...</li>';

    getCategoryMembers(item.fullTitle)
    .then((items: Item[]) => {
        catList.innerHTML = '';
        pageList.innerHTML = '';
        if (items.length > 0) {
            const sorted = items.sort((a, b) => a.cleanTitle.localeCompare(b.cleanTitle)).filter(cat => !locale.excludeItems.includes(cat.cleanTitle));
            const categories = sorted.filter(cat => cat.fullTitle.startsWith(locale.categoryPrefix));
            const pages = sorted.filter(cat => !cat.fullTitle.startsWith(locale.categoryPrefix));

            let categoriesTitle = '';
            if (categories.length === apiPageLimit) {
                categoriesTitle = `Categories (${apiPageLimit})+`;
            } else if (categories.length > 0) {
                categoriesTitle = `Categories (${categories.length})`;
            }
            let pagesTitle = '';
            if (pages.length === apiPageLimit) {
                pagesTitle = `Pages (${apiPageLimit})+`;
            } else if (pages.length > 0) {
                pagesTitle = `Pages (${pages.length})`;
            }

            column.querySelector(`.categoriesTitle`)!.textContent = categoriesTitle;
            column.querySelector(`.pagesTitle`)!.textContent = pagesTitle;

            catList.innerHTML = '';
            pageList.innerHTML = '';

            categories.forEach(cat => {
                handleListItem(cat, columnIndex, catList);
            });
            pages.forEach(page => {
                handleListItem(page, columnIndex, pageList);
            });
        } else {
            catList.innerHTML = '<li>No categories found.</li>';
        }
    });

    let nextColumn: HTMLElement | null = document.getElementById(`column${columnIndex + 1}`);
    // TODO: run this only once, but when data is about to be loaded into the column
    if (!nextColumn) {
        nextColumn = addColumn();
    }
    clearColumns(columnIndex + 1);
}

function _loadPageColumn(columnIndex: number, item: Item): void {
    const column = document.getElementById(`column${columnIndex}`) as HTMLElement;

    column.querySelector('.details')!.innerHTML = '';

    const extractElement = document.createElement('p');
    extractElement.className = 'extract';
    extractElement.textContent = 'Loading...';
    column.querySelector('.details')!.appendChild(extractElement);

    const pageLink = document.createElement('a');
    pageLink.href = `${locale.pageUrl}${encodeURIComponent(item.fullTitle)}`;
    pageLink.target = '_blank';
    pageLink.textContent = "Page";
    column.querySelector('.details')!.appendChild(pageLink);

    getPageData(item.pageid)
        .then((data: any) => {
            const extract = data.query.pages[item.pageid].extract || 'No extract available.';
            extractElement.textContent = extract;
        });
}

function handleListItem(item: Item, columnIndex: number, list: HTMLUListElement) {
    const li = document.createElement('li');
    const nameSpan = document.createElement('span');
    nameSpan.textContent = item.cleanTitle;
    li.appendChild(nameSpan);
    li.onclick = () => {
        removeSelection(columnIndex);
        li.classList.add('selected');
        clearColumns(columnIndex + 1);
        loadColumn(columnIndex + 1, item);
    };
    list.appendChild(li);
}

function createLocalePicker(): void {
    const langSelector = document.getElementById('langSelector') as HTMLSelectElement;
    localeOptions.forEach((loc, idx) => {
        const option = document.createElement('option');
        option.value = idx.toString();
        option.textContent = loc.name;
        if (idx === 0) option.selected = true;
        langSelector.appendChild(option);
    });
    langSelector.addEventListener('change', () => {
        locale = localeOptions[parseInt(langSelector.value)];
        clearColumns(1);
        loadMainCategories();
    });
}

function removeSelection(columnIndex: number): void {
    const column = document.getElementById(`column${columnIndex}`);
    if (!column) return;
    const catList = column.querySelector('.categorieList') as HTMLUListElement;
    const pageList = column.querySelector('.pagesList') as HTMLUListElement;
    Array.from(catList.children).forEach(child => child.classList.remove('selected'));
    Array.from(pageList.children).forEach(child => child.classList.remove('selected'));
}

function scrollToRight(): void {
    document.getElementById('body')!.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'end' });
}

function addColumn(): HTMLElement {
    const columns = document.querySelectorAll('.column');
    const newColumnIndex = columns.length + 1;
    const newColumn = document.createElement('div');
    newColumn.id = `column${newColumnIndex}`;
    newColumn.className = 'column';
    // should correspond with the HTML structure
    newColumn.innerHTML = `
        <h2 class="columnTitle"></h2>
        <div class="details"></div>
        <h3 class="categoriesTitle"></h3>
        <ul class="categorieList"></ul>
        <h3 class="pagesTitle"></h3>
        <ul class="pagesList"></ul>
    `;
    document.getElementById('columns')!.appendChild(newColumn);
    return document.getElementById(`column${newColumnIndex}`);
}

function clearColumns(startingIndex: number): void {
    const column: HTMLElement | null = document.getElementById(`column${startingIndex}`);
    if (column) {
        clearColumn(column);
        clearColumns(startingIndex + 1);
    }
}

function clearColumn(column: HTMLElement): void {
    column.querySelector('.columnTitle')!.textContent = '';
    column.querySelector('.details')!.innerHTML = '';
    column.querySelector('.categoriesTitle')!.textContent = '';
    column.querySelector('.categorieList')!.innerHTML = '';
    column.querySelector('.pagesTitle')!.textContent = '';
    column.querySelector('.pagesList')!.innerHTML = '';
}