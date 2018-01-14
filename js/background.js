var config = {
    apiKey: "AIzaSyBrFE6E4b5h5D8kT8djrVK5qM2Xfn3kBkI",
    authDomain: "cliw-8ef3d.firebaseapp.com",
    databaseURL: "https://cliw-8ef3d.firebaseio.com",
    projectId: "cliw-8ef3d",
    storageBucket: "cliw-8ef3d.appspot.com",
    messagingSenderId: "554773172307"
};
firebase.initializeApp(config);

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        /* console.log(sender.tab ?
             "from a content script:" + sender.tab.url :
             "from the extension");*/

        firebase.database().ref('/users/' + firebase.auth().currentUser.uid).once('value').then(function (snapshot) {
            if (snapshot.val() == null) {
                writeUserData(firebase.auth().currentUser.email)
            }
        });

        if (request.task === "save") {
            // console.log(request,sender)
            updateUserData(firebase.auth().currentUser.email, request, sender.tab.url)
        }
        if (request.task === "get") {
            var starCountRef = firebase.database().ref('users');
            var currentSite = {};
            starCountRef.on('value', function (snapshot) {
                var snap = snapshot.val();
                for (var img in snap[firebase.auth().currentUser.uid].site) {

                    if (snap[firebase.auth().currentUser.uid].site[img].url == sender.tab.url) {
                        currentSite[snap[firebase.auth().currentUser.uid].site[img].img] = snap[firebase.auth().currentUser.uid].site[img];

                    }
                }
            });
            sendResponse({info: firebase.auth().currentUser, imgs: currentSite});
        }
    });

function writeUserData(email) {
    firebase.database().ref('users/' + firebase.auth().currentUser.uid).set({
        site: [{url: null, img: null.src, shapes: []}],
        email: email
    });
}

function updateUserData(email, request, site) {
    var starCountRef = firebase.database().ref('users/' + firebase.auth().currentUser.uid);
    var updates = {};
    starCountRef.on('value', function (snapshot) {
        var snap = snapshot.val();
        let ok = 0;
        updates = snap;
        for (var img in snap.site) {
            if (snap.site[img].url === site && snap.site[img].img === request.src) {
                updates.site[img].shapes = request.polygons;
                ok = 1;
            }
        }
        if (!ok) {
            updates.site.push({img: request.src, url: site, shapes: request.polygons})
        }
    });

    firebase.database().ref('users/' + firebase.auth().currentUser.uid).update(updates);
}

function initApp() {
    // Listen for auth state changes.
    firebase.auth().onAuthStateChanged(function (user) {

        console.log('User state change detected from the Background script of the Chrome Extension:', user);
        chrome.tabs.query({}, function (tabs) {
            for (var i = 0; i < tabs.length; ++i) {
                chrome.tabs.sendMessage(tabs[i].id, {info: user}, function (response) {
                });
            }
        });
        /*  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
              chrome.tabs.sendMessage(tabs[0].id, {info: user}, function(response) {});});
*/
    });

}

window.onload = function () {
    initApp();
};