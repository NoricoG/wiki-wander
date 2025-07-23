// setup

let apiCallCount: number = 0;

document.addEventListener('DOMContentLoaded', () => {
    updateApiCounter();
    loadMainCategories();
});

// type definitions
interface CategoryMember {
    pageid: number;
    ns: number;
    title: string;
}

interface CategoryMembersResponse {
    query?: {
        categorymembers: CategoryMember[];
    };
}

// helper functions

function updateApiCounter(): void {
    apiCallCount++;
    (document.getElementById('apiCounter') as HTMLElement).textContent = `API calls: ${apiCallCount}`;
}

function callApi(url: string): Promise<any> {
    updateApiCounter();
    return fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        });
}

function getCategoryMembers(categoryTitle: string): Promise<CategoryMembersResponse> {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(categoryTitle)}&cmlimit=200&format=json&origin=*`;
    return callApi(url);
}

// specific functions

function loadMainCategories(): void {
    loadColumn(1, 'Category:Main_topic_classifications');
    scrollToRight();
}

function loadColumn(columnIndex: number, chosen: string): void {
    const column = document.getElementById(`column${columnIndex}`) as HTMLElement;
    let nextColumn: HTMLElement | null = document.getElementById(`column${columnIndex + 1}`);
    // TODO: run this only once, but when data is about to be loaded into the column
    if (!nextColumn) {
        nextColumn = addColumn();
    }

    clearColumns(columnIndex + 1);

    const catList = column.querySelector('.categorieList') as HTMLUListElement;
    catList.innerHTML = '<li>Loading...</li>';
    const pageList = column.querySelector('.pagesList') as HTMLUListElement;
    pageList.innerHTML = '<li>Loading...</li>';

    if (chosen.startsWith('Category:')) {
        getCategoryMembers(chosen)
        .then((data: CategoryMembersResponse) => {
            catList.innerHTML = '';
            pageList.innerHTML = '';
            if (data.query && data.query.categorymembers) {
                const sorted = data.query.categorymembers.sort((a, b) => a.title.localeCompare(b.title));

                const categories = sorted.filter(cat => cat.title.startsWith('Category:'));
                const pages = sorted.filter(cat => !cat.title.startsWith('Category:'));

                if (categories.length === 0) {
                    column.querySelector(`.categoriesTitle`)!.textContent = ``;
                    catList.innerHTML = '';
                } else {
                    column.querySelector(`.categoriesTitle`)!.textContent = `Categories (${categories.length})`;
                }
                if (pages.length === 0) {
                    column.querySelector(`.pagesTitle`)!.textContent = ``;
                    pageList.innerHTML = '';
                } else {
                    column.querySelector(`.pagesTitle`)!.textContent = `Pages (${pages.length})`;
                }

                categories.forEach(cat => {
                    if (cat.title == ('Category:Main topic articles')) return;
                    handleListItem(cat, true, columnIndex, catList, pageList, nextColumn);
                });
                pages.forEach(page => {
                    handleListItem(page, false, columnIndex, catList, pageList, nextColumn);
                });
            } else {
                catList.innerHTML = '<li>No categories found.</li>';
            }
        });
    } else {
        window.alert("Not implemented");
    }
}

function handleListItem(item: CategoryMember, isCategory: boolean, columnIndex: number, catList: HTMLUListElement, pageList: HTMLUListElement, nextColumn: HTMLElement | null) {
    const li = document.createElement('li');
    li.style.cursor = 'pointer';
    const nameSpan = document.createElement('span');
    const cleanTitle = isCategory ? item.title.replace('Category:', '') : item.title;
    nameSpan.textContent = cleanTitle;
    li.appendChild(nameSpan);
    li.onclick = () => {
        clearColumns(columnIndex + 1);
        Array.from(catList.children).forEach(child => child.classList.remove('selected'));
        Array.from(pageList.children).forEach(child => child.classList.remove('selected'));
        li.classList.add('selected');
        if (isCategory) {
            nextColumn.querySelector('.title')!.innerHTML = `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}" target="_blank">${cleanTitle}</a>`;
            loadColumn(columnIndex + 1, item.title);
            scrollToRight();
        } else {
            nextColumn.querySelector('.title')!.innerHTML = `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}" target="_blank">${item.title}</a>`;
            const url = `http://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=1&explaintext=1&pageids=${item.pageid}&format=json&origin=*`;
            callApi(url)
            .then((data: any) => {
                const extract = data.query.pages[item.pageid].extract || 'No extract available.';
                nextColumn.querySelector('.extract')!.textContent = extract;
                scrollToRight();
            });
        }
    };
    if (isCategory) {
        catList.appendChild(li);
    } else {
        pageList.appendChild(li);
    }
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
        <h2 class="title"></h2>
        <p class="extract"></p>
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
    column.querySelector('.title')!.textContent = '';
    column.querySelector('.extract')!.textContent = '';
    column.querySelector('.categoriesTitle')!.textContent = '';
    column.querySelector('.categorieList')!.innerHTML = '';
    column.querySelector('.pagesTitle')!.textContent = '';
    column.querySelector('.pagesList')!.innerHTML = '';
}