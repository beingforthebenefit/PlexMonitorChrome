window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('options-form').addEventListener('submit', function (e) {
        e.preventDefault();

        var url = document.getElementById('plexUrl').value;
        var token = document.getElementById('plexToken').value;

        // Validate the URL
        var urlPattern = /^(http|https):\/\/[a-zA-Z0-9-\.]+\.[a-z]{2,4}/;
        if (!urlPattern.test(url)) {
            document.getElementById('status').textContent = 'Invalid URL';
            return;
        }

        // Validate the token
        if (token === '') {
            document.getElementById('status').textContent = 'Token is required';
            return;
        }

        // If everything is valid, show a success message
        document.getElementById('status').textContent = 'Settings saved successfully!';
    });
});

// Saves options to chrome.storage
function save_options() {
    var plexUrl = document.getElementById('plexUrl').value;
    var plexToken = document.getElementById('plexToken').value;
    var moviesLibraryId = document.getElementById('moviesLibrary').value;
    var tvShowsLibraryId = document.getElementById('tvShowsLibrary').value;
    var moviesLibraryName = document.getElementById('moviesLibrary').options[document.getElementById('moviesLibrary').selectedIndex]?.text;
    var tvShowsLibraryName = document.getElementById('tvShowsLibrary').options[document.getElementById('tvShowsLibrary').selectedIndex]?.text;

    chrome.storage.local.set({
        plexUrl: plexUrl,
        plexToken: plexToken,
        moviesLibraryId: moviesLibraryId,
        tvShowsLibraryId: tvShowsLibraryId,
        moviesLibraryName: moviesLibraryName,
        tvShowsLibraryName: tvShowsLibraryName
    }, function() {
        // Check for any error.
        if (chrome.runtime.lastError) {
            console.log(`Error: ${chrome.runtime.lastError}`);
        } else {
            // Update status to let user know options were saved.
            var status = document.getElementById('status');
            status.textContent = 'Options saved.';
            setTimeout(function() {
                status.textContent = '';
            }, 1000);
    
            // Update the Current Library Selections with the new values
            document.getElementById('currentMoviesLibrary').textContent = `Movies Library: ${moviesLibraryName}`;
            document.getElementById('currentTvShowsLibrary').textContent = `TV Shows Library: ${tvShowsLibraryName}`;
        }
    });
}

// Restores select box and checkbox state using the preferences stored in chrome.storage.
function restore_options() {
    chrome.storage.local.get({
        plexUrl: '',
        plexToken: '',
        moviesLibraryId: '',
        tvShowsLibraryId: '',
        moviesLibraryName: '',
        tvShowsLibraryName: ''
    }, function(items) {
        // Check for any error.
        if (chrome.runtime.lastError) {
            console.log(`Error: ${chrome.runtime.lastError}`);
        } else {
            document.getElementById('plexUrl').value = items.plexUrl;
            document.getElementById('plexToken').value = items.plexToken;
            document.getElementById('moviesLibrary').value = items.moviesLibraryId;
            document.getElementById('tvShowsLibrary').value = items.tvShowsLibraryId;
            document.getElementById('currentMoviesLibrary').textContent = items.moviesLibraryName ? `Movies Library: ${items.moviesLibraryName}` : 'Movies Library: Not Set';
            document.getElementById('currentTvShowsLibrary').textContent = items.tvShowsLibraryName ? `TV Shows Library: ${items.tvShowsLibraryName}` : 'TV Shows Library: Not Set';
        }
    });
}


document.getElementById('options-form').addEventListener('submit', function(e) {
    e.preventDefault();
    save_options();
});

document.addEventListener('DOMContentLoaded', function() {
    restore_options();

    let plexUrlInput = document.getElementById('plexUrl');
    let plexTokenInput = document.getElementById('plexToken');
    let listLibrariesButton = document.getElementById('listLibraries');
    let moviesLibrarySelect = document.getElementById('moviesLibrary');
    let tvShowsLibrarySelect = document.getElementById('tvShowsLibrary');
    let optionsForm = document.getElementById('options-form');

    listLibrariesButton.addEventListener('click', function() {
        let plexUrl = plexUrlInput.value;
        let plexToken = plexTokenInput.value;

        // Fetch the libraries
        fetchLibraries(plexUrl, plexToken)
            .then(libraries => {
                // Populate the movies and TV shows library dropdowns
                populateLibraryDropdowns(libraries, moviesLibrarySelect, tvShowsLibrarySelect);
            })
            .catch(error => console.error('Error:', error));
    });

    optionsForm.addEventListener('submit', function(event) {
        event.preventDefault();
        save_options();
    });
});

function fetchLibraries(serverUrl, plexToken) {
    const url = `${serverUrl}/library/sections/?X-Plex-Token=${plexToken}`;

    return fetch(url)
        .then(response => response.text())
        .then(data => {
            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(data, 'text/xml');
            let libraries = xmlDoc.getElementsByTagName('Directory');

            let libraryList = [];
            for (let library of libraries) {
                let libraryId = library.getAttribute('key');
                let libraryTitle = library.getAttribute('title');
                libraryList.push({ id: libraryId, title: libraryTitle });
            }

            return libraryList;
        });
}

function populateLibraryDropdowns(libraries, moviesSelect, tvShowsSelect) {
    // Clear existing options
    moviesSelect.innerHTML = '';
    tvShowsSelect.innerHTML = '';

    // Add default options
    let defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'None';
    moviesSelect.appendChild(defaultOption);
    tvShowsSelect.appendChild(defaultOption);

    // Add library options
    for (let library of libraries) {
        let option = document.createElement('option');
        option.value = library.id;
        option.textContent = library.title;
        moviesSelect.appendChild(option);
        tvShowsSelect.appendChild(option.cloneNode(true));
    }
}

function updateCurrentLibrarySelections(moviesLibraryId, tvShowsLibraryId) {
    var currentMoviesLibraryId = document.getElementById('currentMoviesLibraryId');
    var currentTvShowsLibraryId = document.getElementById('currentTvShowsLibraryId');

    if (moviesLibraryId) {
        currentMoviesLibraryId.textContent = moviesLibraryId
    } else {
        currentMoviesLibraryId.textContent = 'Not Set';
    }

    if (tvShowsLibraryId) {
        currentTvShowsLibraryId.textContent = tvShowsLibraryId;
    } else {
        currentTvShowsLibraryId.textContent = 'Not Set';
    }
}