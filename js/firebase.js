var config = {
    apiKey: "AIzaSyBrFE6E4b5h5D8kT8djrVK5qM2Xfn3kBkI",
    authDomain: "cliw-8ef3d.firebaseapp.com",
    databaseURL: "https://cliw-8ef3d.firebaseio.com",
    projectId: "cliw-8ef3d",
    storageBucket: "cliw-8ef3d.appspot.com",
    messagingSenderId: "554773172307"
};
firebase.initializeApp(config);

function initApp() {

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            document.getElementById('quickstart-button').textContent = 'Sign out';
            document.getElementById('quickstart-sign-in-status').textContent = user.displayName;


        } else {
            document.getElementById('quickstart-button').textContent = 'Sign-in with Google';
            document.getElementById('quickstart-sign-in-status').textContent = 'Anonymous';
        }
        document.getElementById('quickstart-button').disabled = false;
    });
    document.getElementById('switchonoff').addEventListener('click', onoffswitch);
    document.getElementById('globalimageonoff').addEventListener('click', onoffglobalimage);
    document.getElementById('quickstart-button').addEventListener('click', startSignIn, false);
}

/**
 * Start the auth flow and authorizes to Firebase.
 * @param{boolean} interactive True if the OAuth flow should request with an interactive mode.
 */
function startAuth(interactive) {
    // Request an OAuth token from the Chrome Identity API.
    chrome.identity.getAuthToken({interactive: !!interactive}, function (token) {
        if (chrome.runtime.lastError && !interactive) {
            console.log('It was not possible to get a token programmatically.');
        } else if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
        } else if (token) {
            // Authorize Firebase with the OAuth Access Token.
            var credential = firebase.auth.GoogleAuthProvider.credential(null, token);
            firebase.auth().signInWithCredential(credential).catch(function (error) {
                // The OAuth token might have been invalidated. Lets' remove it from cache.
                if (error.code === 'auth/invalid-credential') {
                    chrome.identity.removeCachedAuthToken({token: token}, function () {
                        startAuth(interactive);
                    });
                }
            });
        } else {
            console.error('The OAuth Token was null');
        }
    });
}

/**
 * Starts the sign-in process.
 */

function startSignIn() {
    document.getElementById('quickstart-button').disabled = true;
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();

    } else {
        startAuth(true);
    }
}

window.onload = function () {


    chrome.runtime.sendMessage({get_pop_info: true}, function (response) {
        var toggleswitch = document.getElementById('switchonoff');

        if (response.sign == true) {
            toggleswitch.classList.remove('On');
            toggleswitch.classList.add('Off');
        }
        if (response.sign == false) {
            toggleswitch.classList.remove('Off');
            toggleswitch.classList.add('On');
        }

        var toggleglobalimage = document.getElementById('globalimageonoff');

        if (response.global == true) {
            toggleglobalimage.classList.remove('On');
            toggleglobalimage.classList.add('Off');
        }
        if (response.global == false) {
            toggleglobalimage.classList.remove('Off');
            toggleglobalimage.classList.add('On');
        }

        initApp();
    });

};

function onoffswitch() {
    var toggleswitch = document.getElementById('switchonoff');
    if (toggleswitch.classList.contains('On')) {
        toggleswitch.classList.remove('On');
        toggleswitch.classList.add('Off');
        chrome.runtime.sendMessage({popover: true, sign: false}, function (response) {

        });

    } else {
        toggleswitch.classList.remove('Off');
        toggleswitch.classList.add('On');
        chrome.runtime.sendMessage({popover: true, sign: true}, function (response) {

        });

    }
}

function onoffglobalimage() {
    var toggleglobalimage = document.getElementById('globalimageonoff');
    if (toggleglobalimage.classList.contains('On')) {
        toggleglobalimage.classList.remove('On');
        toggleglobalimage.classList.add('Off');
        chrome.runtime.sendMessage({popover: true, global: false}, function (response) {

        });

    } else {
        toggleglobalimage.classList.remove('Off');
        toggleglobalimage.classList.add('On');
        chrome.runtime.sendMessage({popover: true, global: true}, function (response) {

        });

    }
}

