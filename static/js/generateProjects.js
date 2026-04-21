document.addEventListener('DOMContentLoaded', function() {
    fetch('static/json/projects.json')
        .then(response => response.json())
        .then(data => processJSON(data));
});

function processJSON(data) {
    generateMainContent(data);
}
function generateMainContent(projects) {
    const mainContent = document.getElementById('contentDiv');
    const gridContainer = document.createElement('ul');
    gridContainer.className = 'gridContainer';
    projects.forEach(project => {
        const gridItem = document.createElement('li');
        gridItem.className = 'gridItem';

        const descBox = document.createElement('div');
        descBox.className = 'descBox';

        const name = document.createElement('p');
        name.className = 'font28 title';
        name.textContent = project.title;
        // const year = document.createElement('p');
        // year.className = 'font20 year';
        // year.textContent = project.year;

        const description = document.createElement('p');
        description.className = 'description font14';
        description.textContent = project.description;

        const description2 = document.createElement('p');
        description2.className = 'description font14';
        description2.textContent = project.description2;

        const img = document.createElement('img');
        img.src = project.image;
        img.alt = project.title;

        descBox.appendChild(name);
        // descBox.appendChild(year);
        descBox.appendChild(description);
        descBox.appendChild(description2);

        gridItem.appendChild(descBox);
        gridItem.appendChild(img);

        gridContainer.appendChild(gridItem);
    });
    mainContent.appendChild(gridContainer);
}
